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
