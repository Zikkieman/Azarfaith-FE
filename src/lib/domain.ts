export type CampaignType = "money" | "item" | "volunteer" | "professional" | "emergency";
export type Update = {
  id: string;
  date: string;
  kind?: "progress" | "milestone" | "completion";
  title: string;
  body: string;
  amountSpent?: number;
  imageUrls?: string[];
  videoUrls?: string[];
  receiptUrls?: string[];
};
export type Comment = { id: string; author: string; avatar: string; date: string; body: string };
export type Donation = { id: string; donor: string; amount: number; date: string; note?: string };

export type Category =
  | "Church Building"
  | "Missions & Outreach"
  | "Orphanage"
  | "Education"
  | "Food & Relief"
  | "Medical Mission"
  | "Emergency"
  | "Community Development"
  | "Other";

export const campaignCategories: Category[] = [
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

export type OrgCategory = "church" | "mission" | "orphanage" | "school" | "other";
export type Org = {
  id: string; name: string; tagline: string; contactPhone?: string; category: OrgCategory; location: string;
  denomination: string; founded: string; bio: string; photos: string[]; videos: string[];
  campaignIds: string[]; verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  totalReceived: number; supporters: number;
};
export type Campaign = {
  id: string; ownerId?: string; mode: "one-time" | "ongoing"; type: CampaignType; title: string; story: string;
  faithCategory: Category; customFaithCategory?: string; orgId?: string;
  raiser: { name: string; avatar: string; location: string; trustScore: number };
  cover: string; gallery: string[]; goal?: number; raised: number; donors: number; currency: "NGN";
  location: string; urgency: "low" | "medium" | "high" | "critical"; createdAt: string;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  updates: Update[]; comments: Comment[]; donations: Donation[]; needs?: string[];
  frequencies?: Array<"weekly" | "monthly" | "quarterly">;
};
export type RecurringDonation = { id: string; donorId: string; targetId: string; targetName: string; targetCover: string; amount: number; frequency: "weekly" | "monthly" | "quarterly"; mode: "auto" | "pledge"; nextDate: string; active: boolean; paused?: boolean; startedAt?: string; method?: string };
export type UserRole = "donor" | "org_admin" | "platform_admin";
export type UserStatus = "active" | "suspended";
export type User = { id: string; name: string; email: string; phone: string; avatar: string; role: UserRole; status: UserStatus; phoneVerified: boolean; emailVerified: boolean; bvnVerified: boolean; suspendedAt?: string; suspendReason?: string; joinedAt: string; totalGiven: number; donationsCount: number; campaignsCreated: number };
export type PlatformSettings = { platformFeePercent: number; minDonation: number; maxDonation: number; maxTipAmount: number; campaignExpiryDays: number; autoApproveVerifiedOrgs: boolean; requirePhoneForCampaigns: boolean; reapplicationDays: number; emailNotifications: boolean; smsNotifications: boolean; adminNotificationEmail: string };
export type AdminNotification = { id: string; type: "org_verification" | "campaign_moderation" | "user_report" | "system"; title: string; message: string; read: boolean; createdAt: string; link?: string };

export const formatMoney = (amount: number, currency: Campaign["currency"] = "NGN") =>
  `${currency === "NGN" ? "₦" : ""}${amount.toLocaleString("en-NG")}`;
export const formatCompactMoney = (amount: number) => {
  if (amount >= 1_000_000) return `₦${+(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 10_000) return `₦${Math.round(amount / 1_000)}K`;
  return `₦${amount.toLocaleString("en-NG")}`;
};
