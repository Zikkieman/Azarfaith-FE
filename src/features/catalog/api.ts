import { adminApiFetch, apiFetch } from "@/lib/api";
import type {
  OrganizationDashboard,
  OrganizationDraftSummary,
  Campaign,
  DonationDetail,
  DonationHistoryItem,
  Org,
  Profile,
  RecurringDonation,
  SavedPaymentMethod,
} from "@/lib/catalog";

const MAX_MEDIA_SIZE_BYTES = 5 * 1024 * 1024;

export type CreateOrganizationPayload = {
  name: string;
  tagline: string;
  category: "CHURCH" | "MISSION" | "ORPHANAGE" | "SCHOOL" | "OTHER";
  denomination: string;
  foundedYear?: number;
  location: string;
  bio: string;
  photoUrls?: string[];
  videoUrls?: string[];
};

export type CreateCampaignPayload = {
  mode: "ONE_TIME" | "ONGOING";
  type: "MONEY" | "ITEM" | "VOLUNTEER" | "PROFESSIONAL" | "EMERGENCY";
  title: string;
  story: string;
  faithCategory:
    | "CHURCH_BUILDING"
    | "MISSIONS_OUTREACH"
    | "ORPHANAGE"
    | "EDUCATION"
    | "FOOD_RELIEF"
    | "MEDICAL_MISSION"
    | "EMERGENCY"
    | "COMMUNITY_DEVELOPMENT";
  organizationId?: string;
  location: string;
  goalAmount?: number;
  urgency?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  coverImageUrl?: string;
  galleryImageUrls?: string[];
  needs?: string[];
  frequencies?: Array<"WEEKLY" | "MONTHLY" | "QUARTERLY">;
};

export type CreateDonationPayload = {
  amount: number;
  paymentMethod: "CARD" | "BANK";
  frequency?: "WEEKLY" | "MONTHLY" | "QUARTERLY";
  recurringMode?: "AUTO" | "PLEDGE";
  autoChargeConsent?: boolean;
  donorName?: string;
  isAnonymous?: boolean;
  note?: string;
  tipAmount?: number;
  recurringGiftId?: string;
};

export type UploadMediaPayload = {
  file: File;
  folder: "user-avatar" | "organization-photo" | "campaign-cover" | "campaign-gallery";
  entityId?: string;
};

export type UpdateProfilePayload = {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
};

export type SaveOrganizationDraftPayload = Partial<CreateOrganizationPayload>;
export type UpdateOrganizationPayload = Partial<CreateOrganizationPayload>;

export type UpdateCampaignPayload = Omit<
  Partial<CreateCampaignPayload>,
  "mode" | "type"
>;

export type AdminActivityItem = {
  id: string;
  type: "org_registered" | "campaign_submitted" | "donation";
  title: string;
  description: string;
  timestamp: string;
  link: string;
};

export type AdminDashboard = {
  totalUsers: number;
  verifiedOrganizations: number;
  totalOrganizations: number;
  pendingOrganizations: number;
  activeCampaigns: number;
  pendingCampaigns: number;
  totalRaised: number;
  donationChart: Array<{ label: string; value: number }>;
  campaignStatusChart: Array<{ label: string; value: number }>;
  recentActivity: AdminActivityItem[];
};

export type AdminNotificationItem = {
  id: string;
  kind: "organization_review" | "campaign_review" | "donation" | "audit";
  title: string;
  message: string;
  link: string;
  createdAt: string;
  relativeTime: string;
};

export type AdminOrganization = {
  id: string;
  ownerId: string;
  name: string;
  tagline: string;
  category: "church" | "mission" | "orphanage" | "school" | "other";
  verificationStatus: "verified" | "pending" | "unverified";
  owner: { id: string; fullName: string; email: string; phone: string };
  location: string;
  denomination: string;
  founded: string;
  bio: string;
  photos: string[];
  videos: string[];
  campaignIds: string[];
  totalReceived: number;
  supporters: number;
  reviewAction?: "approved" | "rejected" | "more_info_requested";
  reviewReason?: string;
  reviewedAt?: string;
  reviewedByEmail?: string;
  createdAt: string;
};

export type AdminOrganizationDetail = Omit<AdminOrganization, "owner" | "createdAt" | "campaignIds"> & {
  campaigns: Array<{
    id: string;
    title: string;
    cover: string;
    raised: number;
    donors: number;
    verificationStatus: "verified" | "pending" | "unverified";
  }>;
};

export type AdminCampaign = {
  id: string;
  ownerId: string;
  title: string;
  story: string;
  mode: "one-time" | "ongoing";
  type: "money" | "item" | "volunteer" | "professional" | "emergency";
  faithCategory: string;
  verificationStatus: "verified" | "pending" | "unverified";
  raiser: { name: string; avatar: string; location: string };
  organization: { id: string; name: string } | null;
  orgId?: string;
  cover: string;
  goal?: number;
  raised: number;
  donors: number;
  location: string;
  urgency: "low" | "medium" | "high" | "critical";
  reviewAction?: "approved" | "rejected" | "changes_requested";
  reviewReason?: string;
  reviewedAt?: string;
  reviewedByEmail?: string;
  createdAt: string;
};

export type AdminCampaignDetail = Omit<AdminCampaign, "organization"> & {
  gallery: string[];
  currency: string;
  updates: Array<{ id: string; date: string; title: string; body: string }>;
  comments: Array<{ id: string; author: string; avatar: string; date: string; body: string }>;
  donations: Array<{ id: string; donor: string; amount: number; date: string; note?: string }>;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: "donor" | "org_admin" | "platform_admin";
  status: "active" | "suspended";
  phoneVerified: boolean;
  emailVerified: boolean;
  bvnVerified: boolean;
  totalGiven: number;
  donationsCount: number;
  campaignsCreated: number;
  joinedAt: string;
};

export type AdminUserDetail = AdminUser & {
  suspendReason?: string;
  suspendedAt?: string;
};

export type AdminPlatformSettings = {
  id: string;
  platformFeePercent: number;
  minDonation: number;
  maxDonation: number;
  maxTipAmount: number;
  campaignExpiryDays: number;
  autoApproveVerifiedOrgs: boolean;
  requirePhoneForCampaigns: boolean;
  reapplicationDays: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  adminNotificationEmail: string;
  updatedAt: string;
};

const toQuery = (params: Record<string, string | undefined>) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

export const listOrganizations = (params?: { search?: string; category?: string }) =>
  apiFetch<Org[]>(`/organizations${toQuery(params ?? {})}`);

export const getOrganization = (id: string) =>
  apiFetch<Org & { campaigns: Campaign[] }>(`/organizations/${id}`);

export const listOrganizationDrafts = () =>
  apiFetch<OrganizationDraftSummary[]>("/organizations/mine/drafts");

export const getOrganizationDraft = (id: string) =>
  apiFetch<Org>(`/organizations/drafts/${id}`);

export const getOrganizationDashboard = (id: string) =>
  apiFetch<OrganizationDashboard>(`/organizations/${id}/dashboard`);

export const createOrganization = (payload: CreateOrganizationPayload) =>
  apiFetch<Org>("/organizations", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const saveOrganizationDraft = (payload: SaveOrganizationDraftPayload) =>
  apiFetch<Org>("/organizations/drafts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateOrganizationDraft = (
  id: string,
  payload: SaveOrganizationDraftPayload,
) =>
  apiFetch<Org>(`/organizations/${id}/draft`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const submitOrganizationDraft = (id: string) =>
  apiFetch<Org>(`/organizations/${id}/submit`, {
    method: "POST",
  });

export const updateOrganization = (id: string, payload: UpdateOrganizationPayload) =>
  apiFetch<Org>(`/organizations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const listCampaigns = (params?: {
  search?: string;
  mode?: string;
  faithCategory?: string;
  organizationId?: string;
}) => apiFetch<Campaign[]>(`/campaigns${toQuery(params ?? {})}`);

export const getCampaign = (id: string) => apiFetch<Campaign>(`/campaigns/${id}`);

export const createCampaign = (payload: CreateCampaignPayload) =>
  apiFetch<Campaign>("/campaigns", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateCampaign = (id: string, payload: UpdateCampaignPayload) =>
  apiFetch<Campaign>(`/campaigns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const createCampaignComment = (id: string, payload: { body: string }) =>
  apiFetch<Campaign>(`/campaigns/${id}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createCampaignUpdate = (
  id: string,
  payload: { title: string; body: string },
) =>
  apiFetch<Campaign>(`/campaigns/${id}/updates`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createDonation = (campaignId: string, payload: CreateDonationPayload) =>
  apiFetch<{
    message: string;
    donationId: string;
    reference: string;
    authorizationUrl: string;
    accessCode: string;
  }>(`/campaigns/${campaignId}/donations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const verifyDonation = (campaignId: string, reference: string) =>
  apiFetch<{ message: string; donationId: string; recurringGiftId: string | null }>(
    `/campaigns/${campaignId}/donations/verify`,
    {
      method: "POST",
      body: JSON.stringify({ reference }),
    },
  );

export const uploadMedia = async ({ file, folder, entityId }: UploadMediaPayload) => {
  if (file.size > MAX_MEDIA_SIZE_BYTES) {
    throw new Error("Media uploads must be 5 MB or smaller.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  if (entityId) formData.append("entityId", entityId);

  return apiFetch<{
    url: string;
    publicId: string;
    width: number | null;
    height: number | null;
    format: string | null;
    bytes: number | null;
    folder: string;
  }>("/media/upload", {
    method: "POST",
    body: formData,
  });
};

export const getProfile = () => apiFetch<Profile>("/me/profile");

export const updateProfile = (payload: UpdateProfilePayload) =>
  apiFetch<Profile>("/me/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const getRecurringGifts = () => apiFetch<RecurringDonation[]>("/me/recurring-gifts");

export const getDonationHistory = () => apiFetch<DonationHistoryItem[]>("/me/donations");

export const getDonationDetail = (id: string) =>
  apiFetch<DonationDetail>(`/me/donations/${id}`);

export const getPaymentMethods = () =>
  apiFetch<SavedPaymentMethod[]>("/me/payment-methods");

export const cancelRecurringGift = (id: string) =>
  apiFetch<{ message: string }>(`/me/recurring-gifts/${id}/cancel`, {
    method: "PATCH",
  });

export const updateRecurringGiftPaymentMethod = (
  id: string,
  payload: { authorizationId: string; consentToAutoCharge: boolean },
) =>
  apiFetch<{ message: string }>(`/me/recurring-gifts/${id}/payment-method`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deactivatePaymentMethod = (id: string, payload?: { reason?: string }) =>
  apiFetch<{ message: string }>(`/me/payment-methods/${id}/deactivate`, {
    method: "PATCH",
    body: JSON.stringify(payload ?? {}),
  });

export const getCloudinaryStatus = () =>
  apiFetch<{ provider: string; enabled: boolean; missing: string[] }>(
    "/media/cloudinary/status",
  );

export const getAdminDashboard = () =>
  adminApiFetch<AdminDashboard>("/admin/review/dashboard");

export const getAdminNotifications = () =>
  adminApiFetch<AdminNotificationItem[]>("/admin/review/notifications");

export const listAdminOrganizations = (params?: {
  status?: "VERIFIED" | "PENDING" | "UNVERIFIED";
  search?: string;
  category?: "CHURCH" | "MISSION" | "ORPHANAGE" | "SCHOOL" | "OTHER";
}) => adminApiFetch<AdminOrganization[]>(`/admin/review/organizations${toQuery(params ?? {})}`);

export const getAdminOrganization = (id: string) =>
  adminApiFetch<AdminOrganizationDetail>(`/admin/review/organizations/${id}`);

export const updateAdminOrganizationStatus = (
  id: string,
  payload: {
    status: "VERIFIED" | "PENDING" | "UNVERIFIED";
    reviewAction?: "APPROVED" | "REJECTED" | "MORE_INFO_REQUESTED";
    reason?: string;
  },
) =>
  adminApiFetch<AdminOrganizationDetail>(
    `/admin/review/organizations/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );

export const listAdminCampaigns = (params?: {
  status?: "VERIFIED" | "PENDING" | "UNVERIFIED";
  search?: string;
  mode?: "ONE_TIME" | "ONGOING";
  type?: "MONEY" | "ITEM" | "VOLUNTEER" | "PROFESSIONAL" | "EMERGENCY";
}) => adminApiFetch<AdminCampaign[]>(`/admin/review/campaigns${toQuery(params ?? {})}`);

export const getAdminCampaign = (id: string) =>
  adminApiFetch<AdminCampaignDetail>(`/admin/review/campaigns/${id}`);

export const updateAdminCampaignStatus = (
  id: string,
  payload: {
    status: "VERIFIED" | "PENDING" | "UNVERIFIED";
    reviewAction?: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
    reason?: string;
  },
) =>
  adminApiFetch<AdminCampaignDetail>(
    `/admin/review/campaigns/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );

export const listAdminUsers = (params?: { search?: string }) =>
  adminApiFetch<AdminUser[]>(`/admin/review/users${toQuery(params ?? {})}`);

export const getAdminUser = (id: string) =>
  adminApiFetch<AdminUserDetail>(`/admin/review/users/${id}`);

export const updateAdminUserStatus = (
  id: string,
  payload: { status: "active" | "suspended"; reason?: string },
) =>
  adminApiFetch<AdminUserDetail>(`/admin/review/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const updateAdminUserRole = (
  id: string,
  payload: { role: "donor" | "org_admin" | "platform_admin" },
) =>
  adminApiFetch<AdminUserDetail>(`/admin/review/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const getAdminPlatformSettings = () =>
  adminApiFetch<AdminPlatformSettings>("/admin/review/settings");

export const updateAdminPlatformSettings = (
  payload: Partial<Omit<AdminPlatformSettings, "id" | "updatedAt">>,
) =>
  adminApiFetch<AdminPlatformSettings>("/admin/review/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
