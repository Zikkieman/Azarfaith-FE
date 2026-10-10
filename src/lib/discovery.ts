import type { Campaign, CampaignFrequency, Org } from "@/lib/catalog";

export type DiscoveryView = "all" | "urgent" | "nearly" | "regular" | "new" | "one-time";
export type DiscoverySort = "urgent" | "nearly" | "newest" | "givers";
export type CatalogPage<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export function isPublished(
  cause: Pick<Campaign | Org, "isPublic" | "isDraft" | "verificationStatus">,
) {
  return cause.isPublic === true && !cause.isDraft && cause.verificationStatus === "verified";
}

export function givingFrequencies(
  campaign: Pick<Campaign, "mode" | "frequencies">,
): Array<"once" | CampaignFrequency> {
  return ["once", ...(campaign.mode === "ongoing" ? [...new Set(campaign.frequencies ?? [])] : [])];
}

export function progressPercent(raised: number, goal?: number) {
  return goal && goal > 0 ? Math.min(100, Math.max(0, Math.round((raised / goal) * 100))) : null;
}

export function activityDate(activity: { date: string; createdAt?: string }) {
  const timestamp = activity.createdAt ?? activity.date;
  return Number.isNaN(Date.parse(timestamp))
    ? activity.date
    : new Date(timestamp).toLocaleDateString();
}
