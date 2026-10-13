export type DashboardReview = {
  isDraft: boolean;
  verificationStatus: string;
  reviewAction: string | null;
  reviewReason: string | null;
};

export type DashboardOrganization = DashboardReview & {
  id: string;
  name: string;
  location: string;
  cover: string | null;
  submittedAt: string | null;
  hasRegistrationDocuments: boolean;
};

export type UserDashboard = {
  fullName: string;
  period: { start: string; end: string; timezone: string };
  organizations: DashboardOrganization[];
  selectedOrganization: DashboardOrganization | null;
  reviewProgress?: { documentsChecked: boolean; leadershipChecked: boolean } | null;
  giving: {
    lifetime: number;
    thisMonth: number;
    campaignsSupported: number;
    activeRecurring: number;
  };
  overview: {
    totalReceived: number;
    thisMonthReceived: number;
    giftsReceived: number;
    givers?: number;
    recurringSupporters: number;
    liveCampaigns: number;
    pendingCampaigns: number;
  };
  campaigns: Array<
    DashboardReview & {
      id: string;
      title: string;
      cover: string | null;
      goal: number | null;
      mode: string;
      raised: number;
      giftCount: number;
      givers?: number;
      galleryCount?: number;
      lastUpdateAt: string | null;
    }
  >;
  recentGifts: Array<{
    id: string;
    amount: number;
    donorName: string;
    date: string;
    campaignId: string;
    campaignTitle: string;
    canThank?: boolean;
    note?: string | null;
  }>;
  payout: {
    availableBalance: number;
    totalPlatformFees: number;
    totalReleased: number;
    account: { status: string; bankName: string; accountNumberLast4: string } | null;
  };
};

export function dashboardStatus(record: DashboardReview): {
  label: string;
  tone: "neutral" | "success" | "attention";
} {
  if (record.isDraft) return { label: "Draft", tone: "neutral" };
  if (record.reviewAction === "rejected") return { label: "Rejected", tone: "attention" };
  if (record.reviewAction === "more_info_requested")
    return { label: "More information needed", tone: "attention" };
  if (record.reviewAction === "changes_requested")
    return { label: "Changes requested", tone: "attention" };
  if (record.verificationStatus === "verified") return { label: "Verified", tone: "success" };
  if (record.verificationStatus === "pending") return { label: "In review", tone: "attention" };
  return { label: "Not yet verified", tone: "neutral" };
}

export function dashboardMonthsSince(iso: string, now = new Date()) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return 0;
  return Math.max(
    0,
    (now.getUTCFullYear() - date.getUTCFullYear()) * 12 + now.getUTCMonth() - date.getUTCMonth(),
  );
}

export function dashboardGiftAge(iso: string, now = new Date()) {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return "Date unavailable";
  const hours = Math.floor(Math.max(0, now.getTime() - time) / 3600000);
  if (!hours) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : `${Math.floor(days / 7)}w ago`;
}

export function dashboardCompactMoney(amount: number) {
  if (amount >= 1000000) return `₦${+(amount / 1000000).toFixed(1)}M`;
  if (amount >= 10000) return `₦${Math.round(amount / 1000)}K`;
  return `₦${amount.toLocaleString("en-NG")}`;
}
