import type { CreateCampaignPayload, CreateOrganizationPayload } from "@/features/catalog/api";
import type { Campaign, Org, PayoutAccount } from "@/lib/catalog";

export type OrgForm = Omit<CreateOrganizationPayload, "category" | "foundedYear"> & {
  category: CreateOrganizationPayload["category"] | "";
  foundedYear: string;
  photoUrls: string[];
  externalLinks: string[];
  registrationDocumentUrls: string[];
};
export type CampaignForm = Omit<
  CreateCampaignPayload,
  "mode" | "type" | "faithCategory" | "goalAmount"
> & {
  mode: CreateCampaignPayload["mode"] | "";
  type: CreateCampaignPayload["type"] | "";
  faithCategory: CreateCampaignPayload["faithCategory"] | "";
  goalAmount: string;
  galleryImageUrls: string[];
  needs: string[];
  frequencies: NonNullable<CreateCampaignPayload["frequencies"]>;
};
export const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;
export function campaignPayoutError({
  account,
  loading,
  failed,
}: {
  account?: Pick<PayoutAccount, "active" | "status"> | null;
  loading: boolean;
  failed: boolean;
}): string | undefined {
  if (loading) return "Please wait while we load your saved payout account.";
  if (failed) return "Could not check your saved payout account. Retry before submitting.";
  if (!account) return "Add a payout account once in your profile to submit campaigns.";
  if (!account.active || account.status === "inactive")
    return "Your saved payout account is inactive. Review your payout settings; do not register it again.";
  if (account.status !== "verified")
    return "Your account is already saved but needs verification before submission. You do not need to enter it again.";
  return undefined;
}
export function focusError(key: string) {
  const target = document.getElementById(`field-${key}`);
  target?.scrollIntoView({ behavior: "smooth", block: "center" });
  target
    ?.querySelector<HTMLElement>("input,textarea,select,button")
    ?.focus({ preventScroll: true });
}
export function normalizePublicLink(value: string): string | null {
  const raw = value.trim();
  if (!raw || /[\s\\]/.test(raw) || raw.startsWith("//")) return null;
  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(raw);
  if (hasScheme && !/^https?:\/\/[^/?#]/i.test(raw)) return null;
  try {
    const url = new URL(hasScheme ? raw : `https://${raw}`);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.hostname.length > 253 ||
      url.hostname.split(".").some((label) => label.length > 63) ||
      !/^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z](?:[a-z\d-]*[a-z\d])?$/i.test(url.hostname)
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}
export function publicLink(value: string) {
  return normalizePublicLink(value) !== null;
}
export function validateMedia(
  files: Array<Pick<File, "size" | "type">>,
  existing: number,
  limit: number,
  documents = false,
) {
  if (existing + files.length > limit)
    return `You can upload up to ${limit} ${documents ? "documents" : "photos"}.`;
  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) return "Each file must be 5 MB or smaller.";
    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
        ...(documents ? ["application/pdf"] : []),
      ].includes(file.type)
    )
      return documents
        ? "Choose a PDF, JPEG, PNG or WebP document."
        : "Choose JPEG, PNG or WebP photos.";
  }
  return null;
}
export function orgForm(draft?: Org): OrgForm {
  return {
    name: draft?.name ?? "",
    category: (draft?.category.toUpperCase() ?? "") as OrgForm["category"],
    otherCategoryLabel: draft?.otherCategoryLabel ?? "",
    denomination: draft?.denomination ?? "",
    foundedYear: draft?.founded ?? "",
    location: draft?.location ?? "",
    tagline: draft?.tagline ?? "",
    bio: draft?.bio ?? "",
    photoUrls: draft?.photos ?? [],
    externalLinks: draft?.links ?? [],
    registrationDocumentUrls: draft?.registrationDocuments ?? [],
  };
}
export function organizationPayload(form: OrgForm) {
  return {
    ...form,
    name: form.name.trim(),
    tagline: form.tagline.trim(),
    bio: form.bio.trim(),
    category: form.category || undefined,
    otherCategoryLabel: form.category === "OTHER" ? form.otherCategoryLabel?.trim() : undefined,
    foundedYear: form.foundedYear ? Number(form.foundedYear) : null,
    denomination: form.denomination.trim(),
    location: form.location.trim(),
    externalLinks: form.externalLinks.map((link) => normalizePublicLink(link) ?? link.trim()),
  };
}
export function organizationErrors(form: OrgForm) {
  const errors: Record<string, string> = {};
  if (form.name.trim().length < 2 || form.name.trim().length > 120)
    errors.name = "Use 2 to 120 characters for the organization name.";
  if (!form.category) errors.category = "Choose a category.";
  if (form.category === "OTHER" && (form.otherCategoryLabel?.trim().length ?? 0) < 2)
    errors.otherCategoryLabel = "Tell us what kind of ministry this is.";
  if (form.denomination.trim().length < 2)
    errors.denomination = "Add your denomination or tradition.";
  if (form.location.trim().length < 2) errors.location = "Add your city and state.";
  if (
    form.foundedYear &&
    (!/^\d{4}$/.test(form.foundedYear) ||
      Number(form.foundedYear) < 1800 ||
      Number(form.foundedYear) > new Date().getFullYear())
  )
    errors.foundedYear = "Enter a year from 1800 to the current year.";
  if (form.tagline.trim().length < 10 || form.tagline.trim().length > 200)
    errors.tagline = "Use a tagline of 10 to 200 characters.";
  if (countWords(form.bio) < 100 || countWords(form.bio) > 200)
    errors.bio = "Write 100 to 200 words about your organization.";
  if (form.photoUrls.length < 3)
    errors.photoUrls = "Upload at least 3 photos. Your first photo is the cover.";
  if (!form.registrationDocumentUrls.length)
    errors.registrationDocumentUrls = "Add a CAC document or a recommendation letter.";
  const links = form.externalLinks.map(normalizePublicLink);
  if (links.some((link) => !link))
    errors.externalLinks = "Enter a valid website or social link, such as www.example.com.";
  else if (links.length > 10 || new Set(links).size !== links.length)
    errors.externalLinks = "Add up to 10 different links.";
  return errors;
}
export function campaignForm(draft?: Campaign): CampaignForm {
  const categories: Record<string, CreateCampaignPayload["faithCategory"]> = {
    "Church Building": "CHURCH_BUILDING",
    "Missions & Outreach": "MISSIONS_OUTREACH",
    Orphanage: "ORPHANAGE",
    Education: "EDUCATION",
    "Food & Relief": "FOOD_RELIEF",
    "Medical Mission": "MEDICAL_MISSION",
    Emergency: "EMERGENCY",
    "Community Development": "COMMUNITY_DEVELOPMENT",
  };
  return {
    mode: draft ? (draft.mode === "ongoing" ? "ONGOING" : "ONE_TIME") : "",
    type: (draft?.type.toUpperCase() ?? "") as CampaignForm["type"],
    title: draft?.title ?? "",
    story: draft?.story ?? "",
    faithCategory: draft ? (categories[draft.faithCategory] ?? "") : "",
    organizationId: draft?.orgId ?? "",
    location: draft?.location ?? "",
    goalAmount: draft?.goal ? draft.goal.toLocaleString("en-US") : "",
    urgency: (draft?.urgency.toUpperCase() ?? "MEDIUM") as CampaignForm["urgency"],
    coverImageUrl:
      draft?.cover && !draft.cover.startsWith("https://placehold.co/") ? draft.cover : "",
    galleryImageUrls: draft?.gallery ?? [],
    needs: draft?.needs ?? [],
    frequencies: (draft?.frequencies ?? []).map((frequency) =>
      frequency.toUpperCase(),
    ) as CampaignForm["frequencies"],
  };
}
export function campaignPayload(form: CampaignForm) {
  return {
    ...form,
    mode: form.mode || undefined,
    type: form.type || undefined,
    faithCategory: form.faithCategory || undefined,
    title: form.title.trim(),
    story: form.story.trim(),
    location: form.location.trim(),
    organizationId: form.organizationId || null,
    goalAmount:
      form.mode === "ONE_TIME" && ["MONEY", "EMERGENCY"].includes(form.type) && form.goalAmount
        ? Number(form.goalAmount.replaceAll(",", ""))
        : null,
    coverImageUrl: form.coverImageUrl || null,
    needs: ["ITEM", "VOLUNTEER", "PROFESSIONAL"].includes(form.type) ? form.needs : [],
    frequencies: form.mode === "ONGOING" ? form.frequencies : [],
  };
}
export function campaignErrors(form: CampaignForm) {
  const errors: Record<string, string> = {};
  if (!form.mode) errors.mode = "Choose one-time or ongoing support.";
  if (!form.type) errors.type = "Choose the kind of help you need.";
  if (form.title.trim().length < 8 || form.title.trim().length > 150)
    errors.title = "Use a title of 8 to 150 characters.";
  if (!form.faithCategory) errors.faithCategory = "Choose a cause category.";
  if (form.location.trim().length < 2) errors.location = "Add your city and state.";
  if (countWords(form.story) < 100 || countWords(form.story) > 200)
    errors.story = "Tell your campaign story in 100 to 200 words.";
  const goalText = form.goalAmount.replaceAll(",", "").trim();
  const goal = Number(goalText);
  if (
    form.mode === "ONE_TIME" &&
    (form.type === "MONEY" || (form.type === "EMERGENCY" && Boolean(goalText))) &&
    (!/^\d+$/.test(goalText) || !Number.isSafeInteger(goal) || goal < 5000 || goal > 2147483647)
  )
    errors.goalAmount = "Set a whole-naira goal from ₦5,000 to ₦2,147,483,647.";
  if (form.mode === "ONGOING" && !form.frequencies.length)
    errors.frequencies = "Choose at least one giving frequency.";
  if (!form.coverImageUrl) errors.coverImageUrl = "Upload a cover photo.";
  if (!form.galleryImageUrls.length) errors.galleryImageUrls = "Add at least one gallery photo.";
  if (["ITEM", "VOLUNTEER", "PROFESSIONAL"].includes(form.type) && !form.needs.length)
    errors.needs = "List at least one item, role or skill needed.";
  return errors;
}
