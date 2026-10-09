import type { UserRole } from "@/lib/mock";

export const roleLabel: Record<UserRole, string> = {
  donor: "Giver",
  org_admin: "Organization admin",
  platform_admin: "Platform admin",
};

export const orgCategoryLabel: Record<string, string> = {
  church: "Church",
  mission: "Mission",
  orphanage: "Orphanage",
  school: "School",
  other: "Ministry",
};

export const campaignTypeLabel: Record<string, string> = {
  money: "Funds",
  item: "Items",
  volunteer: "Volunteers",
  professional: "Professional help",
  emergency: "Emergency",
};
