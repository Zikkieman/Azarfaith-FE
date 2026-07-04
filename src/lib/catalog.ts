export type CampaignType = "money" | "item" | "volunteer" | "professional" | "emergency";
export type CampaignMode = "one-time" | "ongoing";
export type CampaignUrgency = "low" | "medium" | "high" | "critical";
export type VerificationStatus = "unverified" | "pending" | "verified";
export type OrgCategory = "church" | "mission" | "orphanage" | "school" | "other";
export type CampaignFrequency = "weekly" | "monthly" | "quarterly";
export type RecurringGiftMode = "auto" | "pledge";
export type RecurringGiftStatus = "on_track" | "missed" | "completed" | "cancelled";

export type Update = { id: string; date: string; title: string; body: string };
export type Comment = { id: string; author: string; avatar: string; date: string; body: string };
export type Donation = { id: string; donor: string; amount: number; date: string; note?: string };

export type Org = {
  id: string;
  ownerId: string;
  name: string;
  tagline: string;
  category: OrgCategory;
  location: string;
  denomination: string;
  founded: string;
  bio: string;
  photos: string[];
  videos: string[];
  campaignIds: string[];
  verificationStatus: VerificationStatus;
  totalReceived: number;
  supporters: number;
  campaignCount: number;
};

export type Campaign = {
  id: string;
  ownerId: string;
  mode: CampaignMode;
  type: CampaignType;
  title: string;
  story: string;
  faithCategory: string;
  orgId?: string;
  raiser: { name: string; avatar: string; location: string; trustScore: number };
  cover: string;
  gallery: string[];
  goal?: number;
  raised: number;
  donors: number;
  currency: "NGN" | string;
  location: string;
  urgency: CampaignUrgency;
  createdAt: string;
  verificationStatus: VerificationStatus;
  updates: Update[];
  comments: Comment[];
  donations: Donation[];
  needs?: string[];
  frequencies?: CampaignFrequency[];
};

export type RecurringDonation = {
  id: string;
  donorId: string;
  targetId: string;
  targetName: string;
  targetCover: string;
  amount: number;
  frequency: CampaignFrequency;
  mode: RecurringGiftMode;
  status: RecurringGiftStatus;
  nextDate: string;
  nextReminderDate?: string | null;
  missedCount: number;
  retryCount: number;
  authorizationId?: string | null;
  autoChargeConsentAt?: string | null;
  cancellationReason?: string | null;
  active: boolean;
};

export type SavedPaymentMethod = {
  id: string;
  email: string;
  brand?: string | null;
  channel: string;
  bank?: string | null;
  cardType?: string | null;
  last4?: string | null;
  expMonth?: string | null;
  expYear?: string | null;
  reusable: boolean;
  active: boolean;
  deactivatedAt?: string | null;
  lastUsedAt?: string | null;
  linkedRecurringGiftCount: number;
  linkedRecurringGiftTitles: string[];
  label: string;
};

export type DonationHistoryItem = {
  id: string;
  campaignId: string;
  campaignTitle: string;
  organizationName?: string | null;
  amount: number;
  platformFee: number;
  tipAmount: number;
  totalCharged: number;
  status: string;
  donorDisplayName: string;
  isAnonymous: boolean;
  frequency?: CampaignFrequency | null;
  recurringMode?: RecurringGiftMode | null;
  reference: string;
  failureMessage?: string | null;
  paidAt?: string | null;
  createdAt: string;
};

export type DonationDetail = {
  id: string;
  campaignId: string;
  campaignTitle: string;
  organizationName?: string | null;
  amount: number;
  platformFee: number;
  tipAmount: number;
  totalCharged: number;
  status: string;
  donorName: string;
  donorDisplayName: string;
  note?: string | null;
  isAnonymous: boolean;
  frequency?: CampaignFrequency | null;
  recurringMode?: RecurringGiftMode | null;
  reference: string;
  paymentMethod: string;
  failureMessage?: string | null;
  paidAt?: string | null;
  createdAt: string;
  receipt: {
    donorName: string;
    amount: number;
    campaignName: string;
    organization?: string | null;
    date: string;
    transactionReference: string;
    feeBreakdown: {
      platformFee: number;
      tipAmount: number;
      totalCharged: number;
    };
  };
};

export type Profile = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  totalGiven: number;
  activeRecurringGiftCount: number;
  ownedOrganizations: Array<{ id: string; name: string; verificationStatus: VerificationStatus }>;
  ownedCampaigns: Array<{ id: string; title: string; verificationStatus: VerificationStatus }>;
  donationHistory: Array<{ id: string; amount: number; date: string; status: string }>;
  verifications: string[];
};

export const faithCategoryOptions = [
  { value: "CHURCH_BUILDING", label: "Church Building", icon: "⛪" },
  { value: "MISSIONS_OUTREACH", label: "Missions & Outreach", icon: "🌍" },
  { value: "ORPHANAGE", label: "Orphanage", icon: "🏠" },
  { value: "EDUCATION", label: "Education", icon: "📚" },
  { value: "FOOD_RELIEF", label: "Food & Relief", icon: "🍚" },
  { value: "MEDICAL_MISSION", label: "Medical Mission", icon: "🩺" },
  { value: "EMERGENCY", label: "Emergency", icon: "🚨" },
  { value: "COMMUNITY_DEVELOPMENT", label: "Community Development", icon: "🤝" },
] as const;

export const orgCategoryOptions = [
  { value: "CHURCH", label: "Church" },
  { value: "MISSION", label: "Mission / Outreach" },
  { value: "ORPHANAGE", label: "Orphanage" },
  { value: "SCHOOL", label: "School" },
  { value: "OTHER", label: "Other ministry" },
] as const;

export const campaignTypeOptions = [
  { value: "MONEY", label: "Raise funds" },
  { value: "ITEM", label: "Request items" },
  { value: "VOLUNTEER", label: "Find volunteers" },
  { value: "PROFESSIONAL", label: "Professional help" },
  { value: "EMERGENCY", label: "Emergency" },
] as const;

export const urgencyOptions = [
  { value: "LOW", label: "Low", desc: "No rush — we'll get there" },
  { value: "MEDIUM", label: "Medium", desc: "Active need, not critical" },
  { value: "HIGH", label: "High", desc: "We need this soon" },
  { value: "CRITICAL", label: "Critical", desc: "Emergency — act now" },
] as const;

export const frequencyOptions = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
] as const;

export const frequencyLabel: Record<CampaignFrequency | "once", string> = {
  weekly: "Every week",
  monthly: "Every month",
  quarterly: "Every quarter",
  once: "One time",
};

export const formatMoney = (amount: number, currency: Campaign["currency"] = "NGN") => {
  const symbols: Record<string, string> = { NGN: "₦" };
  return `${symbols[currency] ?? currency}${amount.toLocaleString()}`;
};


export const formatAmountInput = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString();
};

export const parseAmountInput = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
};
