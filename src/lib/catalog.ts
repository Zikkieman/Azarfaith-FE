import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Campaign, Category, Org } from "@/lib/domain";

type ApiCampaign = Partial<Campaign> & {
  id: string;
  mode?: string;
  type?: string;
  currency?: string;
  urgency?: string;
  verificationStatus?: string;
  gallery?: string[];
  frequencies?: string[];
  needs?: string[];
  raiser?: Partial<Campaign["raiser"]>;
  isDraft?: boolean;
  isPublic?: boolean;
};

type ApiOrg = Partial<Org> & {
  id: string;
  category?: string;
  verificationStatus?: string;
  photos?: string[];
  campaignIds?: string[];
  isDraft?: boolean;
  isPublic?: boolean;
};

type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

const campaignTypes: Record<string, Campaign["type"]> = {
  money: "money",
  item: "item",
  volunteer: "volunteer",
  professional: "professional",
  emergency: "emergency",
  request_items: "item",
  find_volunteers: "volunteer",
  professional_help: "professional",
};

const categories: Category[] = [
  "Church Building",
  "Missions & Outreach",
  "Orphanage",
  "Education",
  "Food & Relief",
  "Medical Mission",
  "Emergency",
  "Community Development",
  "Other",
];

const toStatus = (value?: string): Campaign["verificationStatus"] =>
  value?.toLowerCase() === "verified"
    ? "verified"
    : value?.toLowerCase() === "rejected"
      ? "rejected"
      : value?.toLowerCase() === "pending"
        ? "pending"
        : "unverified";

export function mapCampaign(value: ApiCampaign): Campaign {
  const cover = value.cover || value.gallery?.[0] || value.raiser?.avatar || "";
  return {
    id: value.id,
    ownerId: value.ownerId,
    mode: value.mode === "ongoing" ? "ongoing" : "one-time",
    type: campaignTypes[value.type?.toLowerCase() ?? ""] ?? "money",
    title: value.title ?? "Untitled campaign",
    story: value.story ?? "",
    faithCategory: categories.includes(value.faithCategory as Category)
      ? (value.faithCategory as Category)
      : "Community Development",
    customFaithCategory: value.customFaithCategory,
    orgId: value.orgId,
    raiser: {
      name: value.raiser?.name ?? "AzarFaith organizer",
      avatar: value.raiser?.avatar || cover,
      location: value.raiser?.location ?? value.location ?? "Nigeria",
      trustScore: value.raiser?.trustScore ?? 0,
    },
    cover,
    gallery: value.gallery?.filter(Boolean) ?? (cover ? [cover] : []),
    goal: value.goal,
    raised: Number(value.raised ?? 0),
    donors: Number(value.donors ?? 0),
    currency: "NGN",
    location: value.location ?? "Nigeria",
    urgency: (["low", "medium", "high", "critical"] as const).includes(
      value.urgency?.toLowerCase() as Campaign["urgency"],
    )
      ? (value.urgency?.toLowerCase() as Campaign["urgency"])
      : "low",
    createdAt: value.createdAt ?? "",
    verificationStatus: toStatus(value.verificationStatus),
    updates: value.updates ?? [],
    comments: value.comments ?? [],
    donations: value.donations ?? [],
    needs: value.needs,
    frequencies: value.frequencies?.filter((frequency): frequency is NonNullable<Campaign["frequencies"]>[number] =>
      ["weekly", "monthly", "quarterly"].includes(frequency),
    ),
  };
}

export function mapOrganization(value: ApiOrg): Org {
  return {
    id: value.id,
    name: value.name ?? "Untitled organization",
    tagline: value.tagline ?? "",
    category: (["church", "mission", "orphanage", "school", "other"] as const).includes(
      value.category?.toLowerCase() as Org["category"],
    )
      ? (value.category?.toLowerCase() as Org["category"])
      : "other",
    location: value.location ?? "Nigeria",
    denomination: value.denomination ?? "",
    founded: value.founded ?? "",
    bio: value.bio ?? "",
    photos: value.photos?.filter(Boolean) ?? [],
    videos: value.videos?.filter(Boolean) ?? [],
    campaignIds: value.campaignIds ?? [],
    verificationStatus: toStatus(value.verificationStatus),
    totalReceived: Number(value.totalReceived ?? 0),
    supporters: Number(value.supporters ?? 0),
  };
}

export async function getCampaigns(query = "") {
  const response = await apiFetch<Page<ApiCampaign>>(`/campaigns/discover${query}`);
  return {
    ...response,
    items: response.items
      .filter((campaign) => !campaign.isDraft && campaign.isPublic !== false)
      .map(mapCampaign),
  };
}

export async function getOrganizations(query = "") {
  const response = await apiFetch<Page<ApiOrg>>(`/organizations/discover${query}`);
  return {
    ...response,
    items: response.items
      .filter((organization) => !organization.isDraft && organization.isPublic !== false)
      .map(mapOrganization),
  };
}

export async function getCampaign(id: string) {
  return mapCampaign(await apiFetch<ApiCampaign>(`/campaigns/${id}`));
}

export async function getOrganization(id: string) {
  const response = await apiFetch<ApiOrg & { campaigns?: ApiCampaign[] }>(`/organizations/${id}`);
  return {
    organization: mapOrganization(response),
    campaigns: (response.campaigns ?? []).map(mapCampaign),
  };
}

export function useCampaign(id: string) {
  return useQuery({ queryKey: ["campaign", id], queryFn: () => getCampaign(id), enabled: Boolean(id) });
}

export function useOrganization(id: string) {
  return useQuery({ queryKey: ["organization", id], queryFn: () => getOrganization(id), enabled: Boolean(id) });
}
