import { create } from "zustand";
import {
  type Campaign,
  type Org,
  type RecurringDonation,
  type User,
  type PlatformSettings,
  type AdminNotification,
  type UserRole,
} from "./domain";
import {
  type AuditAction,
  type AuditEntry,
  type CheckKey,
  type CheckState,
  type Note,
} from "./admin";

type Draft = {
  mode?: Campaign["mode"];
  type?: Campaign["type"];
  title?: string;
  story?: string;
  faithCategory?: Campaign["faithCategory"];
  customFaithCategory?: string;
  orgId?: string;
  location?: string;
  goal?: number;
  urgency?: Campaign["urgency"];
  cover?: string;
  gallery?: string[];
  frequencies?: Campaign["frequencies"];
  needs?: string[];
};

type OrgDraft = {
  name?: string;
  tagline?: string;
  category?: Org["category"];
  otherCategoryLabel?: string;
  denomination?: string;
  location?: string;
  founded?: string;
  bio?: string;
  photos?: string[];
  videos?: string[];
  registrationDocuments?: string[];
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
  /** The organization the signed-in user runs (null until they register one). */
  myOrgId: string | null;
  setMyOrgId: (id: string | null) => void;
  orgDraft: OrgDraft;
  setOrgDraft: (d: Partial<OrgDraft>) => void;
  resetOrgDraft: () => void;

  recurringDonations: RecurringDonation[];
  addRecurringDonation: (r: RecurringDonation) => void;
  cancelRecurringDonation: (id: string) => void;
  updateRecurringDonation: (id: string, patch: Partial<RecurringDonation>) => void;

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
  auditLog: AuditEntry[];
  notes: Record<string, Note[]>;
  addNote: (recordId: string, body: string) => void;
  checks: Record<string, Record<CheckKey, CheckState>>;
  setCheck: (orgId: string, key: CheckKey, value: CheckState, detail?: string) => void;
  givingPaused: boolean;
  setGivingPaused: (paused: boolean) => void;
};

const ADMIN_NAME = "Tunde Adebayo";

/** One audit entry, written by every admin action below. */
const entry = (action: AuditAction, target: AuditEntry["target"], detail?: string): AuditEntry => ({
  id: Math.random().toString(36).slice(2),
  actor: ADMIN_NAME,
  action,
  target,
  detail,
  at: new Date().toISOString(),
});

export const useApp = create<State>((set) => ({
  // AuthProvider derives this from the HttpOnly cookie-backed API session.
  authed: false,
  setAuthed: (v) => set({ authed: v }),

  campaigns: [],
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

  orgs: [],
  addOrg: (o) => set((s) => ({ orgs: [o, ...s.orgs], myOrgId: o.id })),
  myOrgId: null,
  setMyOrgId: (id) => set({ myOrgId: id }),
  orgDraft: {},
  setOrgDraft: (d) => set((s) => ({ orgDraft: { ...s.orgDraft, ...d } })),
  resetOrgDraft: () => set({ orgDraft: {} }),

  recurringDonations: [],
  addRecurringDonation: (r) => set((s) => ({ recurringDonations: [r, ...s.recurringDonations] })),
  updateRecurringDonation: (id, patch) =>
    set((s) => ({
      recurringDonations: s.recurringDonations.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),
  cancelRecurringDonation: (id) =>
    set((s) => ({
      recurringDonations: s.recurringDonations.map((r) =>
        r.id === id ? { ...r, active: false } : r,
      ),
    })),

  // ─── Admin ───
  adminRole: null,
  setAdminRole: (role) => set({ adminRole: role }),
  users: [],
  platformSettings: {
    platformFeePercent: 0,
    minDonation: 0,
    maxDonation: 0,
    maxTipAmount: 0,
    campaignExpiryDays: 0,
    autoApproveVerifiedOrgs: false,
    requirePhoneForCampaigns: false,
    reapplicationDays: 0,
    emailNotifications: false,
    smsNotifications: false,
    adminNotificationEmail: "",
  },
  adminNotifications: [],

  verifyOrg: (id, status, notes) =>
    set((s) => {
      const org = s.orgs.find((o) => o.id === id);
      const action: AuditAction =
        status === "verified"
          ? "org_verified"
          : org?.verificationStatus === "verified"
            ? "org_revoked"
            : "org_rejected";
      return {
        orgs: s.orgs.map((o) => (o.id === id ? { ...o, verificationStatus: status } : o)),
        auditLog: [entry(action, { kind: "org", id, name: org?.name ?? id }, notes), ...s.auditLog],
      };
    }),

  moderateCampaign: (id, status, notes) =>
    set((s) => {
      const c = s.campaigns.find((x) => x.id === id);
      return {
        campaigns: s.campaigns.map((x) => (x.id === id ? { ...x, verificationStatus: status } : x)),
        auditLog: [
          entry(
            status === "verified" ? "campaign_approved" : "campaign_rejected",
            { kind: "campaign", id, name: c?.title ?? id },
            notes,
          ),
          ...s.auditLog,
        ],
      };
    }),

  suspendUser: (id, reason) =>
    set((s) => {
      const u = s.users.find((x) => x.id === id);
      return {
        users: s.users.map((x) =>
          x.id === id
            ? {
                ...x,
                status: "suspended" as const,
                suspendedAt: new Date().toISOString().slice(0, 10),
                suspendReason: reason,
              }
            : x,
        ),
        auditLog: [
          entry("user_suspended", { kind: "user", id, name: u?.name ?? id }, reason),
          ...s.auditLog,
        ],
      };
    }),

  reactivateUser: (id) =>
    set((s) => {
      const u = s.users.find((x) => x.id === id);
      return {
        users: s.users.map((x) =>
          x.id === id
            ? { ...x, status: "active" as const, suspendedAt: undefined, suspendReason: undefined }
            : x,
        ),
        auditLog: [
          entry("user_reactivated", { kind: "user", id, name: u?.name ?? id }),
          ...s.auditLog,
        ],
      };
    }),

  updateUserRole: (id, role) =>
    set((s) => {
      const u = s.users.find((x) => x.id === id);
      return {
        users: s.users.map((x) => (x.id === id ? { ...x, role } : x)),
        auditLog: [
          entry("role_changed", { kind: "user", id, name: u?.name ?? id }, role),
          ...s.auditLog,
        ],
      };
    }),

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
      auditLog: [
        entry("settings_updated", { kind: "platform", name: "Platform settings" }),
        ...s.auditLog,
      ],
    })),

  auditLog: [],

  notes: {},
  addNote: (recordId, body) =>
    set((s) => ({
      notes: {
        ...s.notes,
        [recordId]: [
          {
            id: Math.random().toString(36).slice(2),
            author: ADMIN_NAME,
            body,
            at: new Date().toISOString(),
          },
          ...(s.notes[recordId] ?? []),
        ],
      },
    })),

  checks: {},
  setCheck: (orgId, key, value, detail) =>
    set((s) => {
      const org = s.orgs.find((o) => o.id === orgId);
      return {
        checks: { ...s.checks, [orgId]: { ...s.checks[orgId], [key]: value } },
        auditLog: [
          entry("check_updated", { kind: "org", id: orgId, name: org?.name ?? orgId }, detail),
          ...s.auditLog,
        ],
      };
    }),

  givingPaused: false,
  setGivingPaused: (paused) =>
    set((s) => ({
      givingPaused: paused,
      auditLog: [
        entry(paused ? "giving_paused" : "giving_resumed", {
          kind: "platform",
          name: "All giving",
        }),
        ...s.auditLog,
      ],
    })),
}));
