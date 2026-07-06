import { create } from "zustand";
import {
  campaigns as campaignSeed,
  orgs as orgSeed,
  myRecurringDonations as recurringDonationsSeed,
  users as usersSeed,
  platformSettings as settingsSeed,
  adminNotifications as notificationsSeed,
  type Campaign,
  type Org,
  type RecurringDonation,
  type User,
  type PlatformSettings,
  type AdminNotification,
  type UserRole,
} from "./admin-mock";

type Draft = {
  mode?: Campaign["mode"];
  type?: Campaign["type"];
  title?: string;
  story?: string;
  faithCategory?: Campaign["faithCategory"];
  orgId?: string;
  location?: string;
  goal?: number;
  urgency?: Campaign["urgency"];
  cover?: string;
  frequencies?: Campaign["frequencies"];
  needs?: string[];
};

type OrgDraft = {
  name?: string;
  tagline?: string;
  category?: Org["category"];
  denomination?: string;
  location?: string;
  founded?: string;
  bio?: string;
  photos?: string[];
  videos?: string[];
};

type State = {
  authed: boolean;
  setAuthed: (v: boolean) => void;

  campaigns: Campaign[];
  addCampaign: (c: Campaign) => void;
  donate: (id: string, amount: number, donor: string, note?: string) => void;
  draft: Draft;
  setDraft: (d: Partial<Draft>) => void;
  resetDraft: () => void;

  orgs: Org[];
  addOrg: (o: Org) => void;
  orgDraft: OrgDraft;
  setOrgDraft: (d: Partial<OrgDraft>) => void;
  resetOrgDraft: () => void;

  recurringDonations: RecurringDonation[];
  addRecurringDonation: (r: RecurringDonation) => void;
  cancelRecurringDonation: (id: string) => void;

  // ─── Admin ───
  adminRole: UserRole | null;
  setAdminRole: (role: UserRole | null) => void;
  users: User[];
  platformSettings: PlatformSettings;
  adminNotifications: AdminNotification[];
  verifyOrg: (id: string, status: "verified" | "rejected", notes?: string) => void;
  moderateCampaign: (id: string, status: "verified" | "rejected", notes?: string) => void;
  suspendUser: (id: string, reason: string) => void;
  reactivateUser: (id: string) => void;
  updateUserRole: (id: string, role: UserRole) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updatePlatformSettings: (settings: Partial<PlatformSettings>) => void;
};

export const useApp = create<State>((set) => ({
  authed: true,
  setAuthed: (v) => set({ authed: v }),

  campaigns: campaignSeed,
  addCampaign: (c) => set((s) => ({ campaigns: [c, ...s.campaigns] })),
  donate: (id, amount, donor, note) =>
    set((s) => ({
      campaigns: s.campaigns.map((c) =>
        c.id === id
          ? {
              ...c,
              raised: c.raised + amount,
              donors: c.donors + 1,
              donations: [
                { id: Math.random().toString(36).slice(2), donor, amount, date: "just now", note },
                ...c.donations,
              ],
            }
          : c,
      ),
    })),
  draft: {},
  setDraft: (d) => set((s) => ({ draft: { ...s.draft, ...d } })),
  resetDraft: () => set({ draft: {} }),

  orgs: orgSeed,
  addOrg: (o) => set((s) => ({ orgs: [o, ...s.orgs] })),
  orgDraft: {},
  setOrgDraft: (d) => set((s) => ({ orgDraft: { ...s.orgDraft, ...d } })),
  resetOrgDraft: () => set({ orgDraft: {} }),

  recurringDonations: recurringDonationsSeed,
  addRecurringDonation: (r) => set((s) => ({ recurringDonations: [r, ...s.recurringDonations] })),
  cancelRecurringDonation: (id) =>
    set((s) => ({
      recurringDonations: s.recurringDonations.map((r) =>
        r.id === id ? { ...r, active: false } : r,
      ),
    })),

  // ─── Admin ───
  adminRole: "platform_admin",
  setAdminRole: (role) => set({ adminRole: role }),
  users: usersSeed,
  platformSettings: settingsSeed,
  adminNotifications: notificationsSeed,

  verifyOrg: (id, status, notes) =>
    set((s) => ({
      orgs: s.orgs.map((o) => (o.id === id ? { ...o, verificationStatus: status } : o)),
    })),

  moderateCampaign: (id, status, notes) =>
    set((s) => ({
      campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, verificationStatus: status } : c)),
    })),

  suspendUser: (id, reason) =>
    set((s) => ({
      users: s.users.map((u) =>
        u.id === id
          ? {
              ...u,
              status: "active" as const,
              suspendedAt: new Date().toISOString(),
              suspendReason: reason,
            }
          : u,
      ),
    })),

  reactivateUser: (id) =>
    set((s) => ({
      users: s.users.map((u) =>
        u.id === id
          ? { ...u, status: "active" as const, suspendedAt: undefined, suspendReason: undefined }
          : u,
      ),
    })),

  updateUserRole: (id, role) =>
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, role } : u)),
    })),

  markNotificationRead: (id) =>
    set((s) => ({
      adminNotifications: s.adminNotifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  markAllNotificationsRead: () =>
    set((s) => ({
      adminNotifications: s.adminNotifications.map((n) => ({ ...n, read: true })),
    })),

  updatePlatformSettings: (newSettings) =>
    set((s) => ({
      platformSettings: { ...s.platformSettings, ...newSettings },
    })),
}));
