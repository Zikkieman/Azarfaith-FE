import { apiFetch } from "@/lib/api";
import type {
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

export type UpdateOrganizationPayload = Partial<CreateOrganizationPayload>;

export type UpdateCampaignPayload = Omit<
  Partial<CreateCampaignPayload>,
  "mode" | "type"
>;

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

export const createOrganization = (payload: CreateOrganizationPayload) =>
  apiFetch<Org>("/organizations", {
    method: "POST",
    body: JSON.stringify(payload),
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
