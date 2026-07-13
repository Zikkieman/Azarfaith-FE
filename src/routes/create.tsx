import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Banknote,
  Briefcase,
  Check,
  Gift,
  ImagePlus,
  Loader2,
  Repeat2,
  Siren,
  Target,
  Users,
} from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { PageSpinner } from "@/components/PageSpinner";
import {
  createCampaign,
  getCampaignDraft,
  getCloudinaryStatus,
  listOrganizations,
  saveCampaignDraft,
  submitCampaignDraft,
  updateCampaignDraft,
  uploadMedia,
} from "@/features/catalog/api";
import {
  campaignTypeOptions,
  faithCategoryOptions,
  frequencyOptions,
  formatAmountInput,
  parseAmountInput,
  urgencyOptions,
} from "@/lib/catalog";
import { useRequireAuth } from "@/lib/useRequireAuth";

export const Route = createFileRoute("/create")({
  component: AzarFaithCreate,
});

const campaignTypeIcons = {
  MONEY: Banknote,
  ITEM: Gift,
  VOLUNTEER: Users,
  PROFESSIONAL: Briefcase,
  EMERGENCY: Siren,
} as const;

function AzarFaithCreate() {
  const isAuthed = useRequireAuth();
  const nav = useNavigate();
  const draftId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("draftId") ?? undefined
      : undefined;
  const queryClient = useQueryClient();
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const { data: orgs = [] } = useQuery({
    queryKey: ["organizations", "create"],
    queryFn: () => listOrganizations(),
  });
  const {
    data: mediaStatus,
    isLoading: mediaStatusLoading,
    isError: mediaStatusError,
  } = useQuery({
    queryKey: ["media", "cloudinary-status"],
    queryFn: getCloudinaryStatus,
  });
  const { data: draft } = useQuery({
    queryKey: ["campaign-draft", draftId],
    queryFn: () => getCampaignDraft(draftId!),
    enabled: isAuthed && Boolean(draftId),
  });

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    mode: "" as "ONE_TIME" | "ONGOING" | "",
    type: "" as "MONEY" | "ITEM" | "VOLUNTEER" | "PROFESSIONAL" | "EMERGENCY" | "",
    title: "",
    story: "",
    faithCategory: "" as string,
    organizationId: "",
    location: "",
    goalAmount: "",
    urgency: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    frequencies: [] as Array<"WEEKLY" | "MONTHLY" | "QUARTERLY">,
    coverImageUrl: "",
    galleryImageUrls: [] as string[],
  });

  const countWords = (value: string) =>
    value.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    if (!draft) return;
    setForm({
      mode: draft.mode === "ongoing" ? "ONGOING" : "ONE_TIME",
      type: draft.type.toUpperCase() as
        | "MONEY"
        | "ITEM"
        | "VOLUNTEER"
        | "PROFESSIONAL"
        | "EMERGENCY",
      title: draft.title,
      story: draft.story,
      faithCategory:
        faithCategoryOptions.find((option) => option.label === draft.faithCategory)
          ?.value ?? "",
      organizationId: draft.orgId ?? "",
      location: draft.location,
      goalAmount: draft.goal ? formatAmountInput(String(draft.goal)) : "",
      urgency: draft.urgency.toUpperCase() as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      frequencies: (draft.frequencies ?? []).map((frequency) =>
        frequency.toUpperCase(),
      ) as Array<"WEEKLY" | "MONTHLY" | "QUARTERLY">,
      coverImageUrl: draft.cover.startsWith("https://placehold.co/") ? "" : draft.cover,
      galleryImageUrls: draft.gallery,
    });
  }, [draft]);

  const uploadCoverMutation = useMutation({
    mutationFn: async (file: File) =>
      uploadMedia({
        file,
        folder: "campaign-cover",
        entityId: form.title.trim() || undefined,
      }),
    onSuccess: (upload) => {
      setForm((current) => ({ ...current, coverImageUrl: upload.url }));
      toast.success("Cover image uploaded.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const uploadGalleryMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploads = await Promise.all(
        files.map((file) =>
          uploadMedia({
            file,
            folder: "campaign-gallery",
            entityId: form.title.trim() || undefined,
          }),
        ),
      );

      return uploads.map((upload) => upload.url);
    },
    onSuccess: (urls) => {
      setForm((current) => ({
        ...current,
        galleryImageUrls: [...current.galleryImageUrls, ...urls],
      }));
      toast.success(`${urls.length} gallery image${urls.length > 1 ? "s" : ""} uploaded.`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const ensureMediaReady = () => {
    if (mediaStatus?.enabled) return true;

    if (mediaStatusLoading) {
      toast.error("Checking media upload connection. Try again in a moment.");
      return false;
    }

    if (mediaStatusError) {
      toast.error("Could not confirm media upload setup. Refresh and try again.");
      return false;
    }

    const missing = mediaStatus?.missing?.join(", ");
    toast.error(
      missing
        ? `Media upload is not configured yet: ${missing}`
        : "Media upload is not configured yet.",
    );
    return false;
  };

  const createCampaignMutation = useMutation({
    mutationFn: () =>
      createCampaign({
        mode: form.mode || "ONE_TIME",
        type: form.type || "MONEY",
        title: form.title,
        story: form.story,
        faithCategory: form.faithCategory as
          | "CHURCH_BUILDING"
          | "MISSIONS_OUTREACH"
          | "ORPHANAGE"
          | "EDUCATION"
          | "FOOD_RELIEF"
          | "MEDICAL_MISSION"
          | "EMERGENCY"
          | "COMMUNITY_DEVELOPMENT",
        organizationId: form.organizationId || undefined,
        location: form.location,
        goalAmount:
          form.mode === "ONE_TIME" && form.type === "MONEY"
            ? parseAmountInput(form.goalAmount) || undefined
            : undefined,
        urgency: form.urgency,
        frequencies: form.mode === "ONGOING" ? form.frequencies : undefined,
        coverImageUrl: form.coverImageUrl || undefined,
        galleryImageUrls:
          form.galleryImageUrls.length > 0 ? form.galleryImageUrls : undefined,
      }),
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success("Campaign created successfully.");
      nav({ to: "/campaign/$id", params: { id: campaign.id } });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: () => {
      const payload = {
        mode: form.mode || undefined,
        type: form.type || undefined,
        title: form.title,
        story: form.story,
        faithCategory: form.faithCategory
          ? (form.faithCategory as
              | "CHURCH_BUILDING"
              | "MISSIONS_OUTREACH"
              | "ORPHANAGE"
              | "EDUCATION"
              | "FOOD_RELIEF"
              | "MEDICAL_MISSION"
              | "EMERGENCY"
              | "COMMUNITY_DEVELOPMENT")
          : undefined,
        organizationId: form.organizationId || undefined,
        location: form.location,
        goalAmount:
          form.mode === "ONE_TIME" && form.type === "MONEY"
            ? parseAmountInput(form.goalAmount) || undefined
            : undefined,
        urgency: form.urgency,
        frequencies: form.mode === "ONGOING" ? form.frequencies : undefined,
        coverImageUrl: form.coverImageUrl || undefined,
        galleryImageUrls:
          form.galleryImageUrls.length > 0 ? form.galleryImageUrls : undefined,
      };

      return draftId ? updateCampaignDraft(draftId, payload) : saveCampaignDraft(payload);
    },
    onSuccess: async (campaign) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-drafts"] });
      toast.success("Campaign draft saved.");

      if (!draftId) {
        await nav({
          to: "/create",
          search: { draftId: campaign.id },
          replace: true,
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const submitDraftMutation = useMutation({
    mutationFn: async () => {
      if (!draftId) {
        throw new Error("No campaign draft selected.");
      }

      await updateCampaignDraft(draftId, {
        mode: form.mode || undefined,
        type: form.type || undefined,
        title: form.title,
        story: form.story,
        faithCategory: form.faithCategory
          ? (form.faithCategory as
              | "CHURCH_BUILDING"
              | "MISSIONS_OUTREACH"
              | "ORPHANAGE"
              | "EDUCATION"
              | "FOOD_RELIEF"
              | "MEDICAL_MISSION"
              | "EMERGENCY"
              | "COMMUNITY_DEVELOPMENT")
          : undefined,
        organizationId: form.organizationId || undefined,
        location: form.location,
        goalAmount:
          form.mode === "ONE_TIME" && form.type === "MONEY"
            ? parseAmountInput(form.goalAmount) || undefined
            : undefined,
        urgency: form.urgency,
        frequencies: form.mode === "ONGOING" ? form.frequencies : undefined,
        coverImageUrl: form.coverImageUrl || undefined,
        galleryImageUrls:
          form.galleryImageUrls.length > 0 ? form.galleryImageUrls : undefined,
      });

      return submitCampaignDraft(draftId);
    },
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ["campaign", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-drafts"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success("Campaign submitted for review.");
      nav({ to: "/campaign/$id", params: { id: campaign.id } });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const isOngoing = form.mode === "ONGOING";
  const stepLabels = isOngoing
    ? ["Mode", "Type", "Story", "Details", "Support", "Preview"]
    : ["Mode", "Type", "Story", "Details", "Preview"];

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (step === 0 && !form.mode) nextErrors.mode = "Choose a campaign mode";
    if (step === 1 && !form.type) nextErrors.type = "Choose a type";
    if (step === 2) {
      if (form.title.trim().length < 8)
        nextErrors.title = "Title must be at least 8 characters";
      if (form.title.trim().length > 150)
        nextErrors.title = "Title cannot exceed 150 characters";
      if (countWords(form.story) < 100)
        nextErrors.story = "Story must be at least 100 words";
      if (!form.coverImageUrl) nextErrors.coverImageUrl = "Upload a cover image";
      if (form.galleryImageUrls.length < 1) {
        nextErrors.galleryImageUrls = "Add at least one gallery image";
      }
    }
    if (step === 3) {
      if (!form.faithCategory) nextErrors.faithCategory = "Select a category";
      if (!form.location.trim()) nextErrors.location = "Location is required";
      if (
        !isOngoing &&
        form.type === "MONEY" &&
        (!form.goalAmount || parseAmountInput(form.goalAmount) < 5000)
      ) {
        nextErrors.goalAmount = "Goal must be at least ₦5,000";
      }
    }
    if (step === 4 && isOngoing && form.frequencies.length === 0) {
      nextErrors.frequencies = "Select at least one giving frequency";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const next = () => {
    if (!validate()) return;
    setStep((value) => value + 1);
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageSpinner label="Redirecting to login..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-xl px-5 py-10">
        {draftId ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You are editing a saved campaign draft. Save as you go, then submit when everything is ready.
          </div>
        ) : null}

        <div className="mb-8 flex items-center gap-2">
          {stepLabels.map((label, index) => (
            <div key={label} className="flex flex-1 items-center gap-2 last:flex-none">
              <div
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${index <= step ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}
              >
                {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </div>
              <span
                className={`hidden text-xs sm:block ${index === step ? "font-medium text-foreground" : "text-muted-foreground"}`}
              >
                {label}
              </span>
              {index < stepLabels.length - 1 && (
                <div className={`h-px flex-1 ${index < step ? "bg-amber-400" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-5">
            <h1 className="font-display text-2xl">What kind of campaign?</h1>
            <div className="grid gap-3">
              {[
                {
                  value: "ONE_TIME",
                  title: "One-time campaign",
                  desc: "You have a specific target and need to close.",
                  icon: Target,
                },
                {
                  value: "ONGOING",
                  title: "Ongoing support",
                  desc: "Your ministry is continuous and needs faithful backing.",
                  icon: Repeat2,
                },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      mode: option.value as "ONE_TIME" | "ONGOING",
                    }))
                  }
                  className={`flex items-start gap-4 rounded-2xl border p-5 text-left transition ${form.mode === option.value ? "border-amber-400 bg-amber-50" : "border-border hover:border-amber-200"}`}
                >
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${form.mode === option.value ? "bg-amber-200" : "bg-muted"}`}
                  >
                    <option.icon
                      className={`h-5 w-5 ${form.mode === option.value ? "text-amber-700" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{option.title}</div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {option.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {errors.mode && <p className="text-xs text-destructive">{errors.mode}</p>}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h1 className="font-display text-2xl">What are you asking for?</h1>
            <div className="space-y-2">
              {campaignTypeOptions.map((option) => {
                const Icon = campaignTypeIcons[option.value];
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({ ...current, type: option.value }))
                    }
                    className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition ${form.type === option.value ? "border-amber-400 bg-amber-50" : "border-border hover:border-amber-200"}`}
                  >
                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${form.type === option.value ? "bg-amber-100" : "bg-muted"}`}
                    >
                      <Icon
                        className={`h-4.5 w-4.5 ${form.type === option.value ? "text-amber-600" : "text-muted-foreground"}`}
                      />
                    </div>
                    <div className="flex-1 text-sm font-medium">{option.label}</div>
                    {form.type === option.value && (
                      <Check className="h-4 w-4 text-amber-600" />
                    )}
                  </button>
                );
              })}
            </div>
            {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h1 className="font-display text-2xl">Tell your story</h1>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Campaign title</label>
              <input
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
              />
              {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">What's the need?</label>
              <textarea
                rows={6}
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.story}
                onChange={(event) =>
                  setForm((current) => ({ ...current, story: event.target.value }))
                }
              />
              <div className="mt-1 flex items-center justify-between">
                {errors.story ? <p className="text-xs text-destructive">{errors.story}</p> : <span />}
                <span className="text-xs text-muted-foreground">{form.story.length} chars</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{countWords(form.story)} words</p>
            </div>

            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadCoverMutation.mutate(file);
                event.target.value = "";
              }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length > 0) uploadGalleryMutation.mutate(files);
                event.target.value = "";
              }}
            />

            <div className="rounded-2xl border-2 border-dashed border-border py-8 text-center">
              {form.coverImageUrl ? (
                <img
                  src={form.coverImageUrl}
                  alt=""
                  className="mx-auto mb-4 h-48 w-full max-w-md rounded-2xl object-cover"
                />
              ) : (
                <ImagePlus className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              )}
              <p className="text-sm font-medium">Upload campaign cover</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {mediaStatusLoading
                  ? "Checking Cloudinary connection..."
                  : mediaStatus?.enabled
                    ? "The cover will be stored in Cloudinary under AzarFaith campaign folders."
                    : mediaStatusError
                      ? "Could not confirm Cloudinary status. You can retry after refresh."
                      : `Uploads are unavailable until these credentials are set: ${(mediaStatus?.missing ?? []).join(", ") || "CLOUDINARY_*"}`}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!ensureMediaReady()) return;
                  coverInputRef.current?.click();
                }}
                disabled={uploadCoverMutation.isPending}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadCoverMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {uploadCoverMutation.isPending
                  ? "Uploading..."
                  : form.coverImageUrl
                    ? "Replace cover"
                    : "Choose cover"}
              </button>
              {errors.coverImageUrl ? (
                <p className="mt-3 text-xs text-destructive">{errors.coverImageUrl}</p>
              ) : null}
            </div>

            <div className="rounded-2xl border-2 border-dashed border-border py-8 text-center">
              <ImagePlus className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Upload campaign gallery</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Add more context photos for the campaign detail page. At least one is required before submission.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!ensureMediaReady()) return;
                  galleryInputRef.current?.click();
                }}
                disabled={uploadGalleryMutation.isPending}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadGalleryMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {uploadGalleryMutation.isPending ? "Uploading..." : "Choose gallery images"}
              </button>
              {errors.galleryImageUrls ? (
                <p className="mt-3 text-xs text-destructive">{errors.galleryImageUrls}</p>
              ) : null}
            </div>

            {form.galleryImageUrls.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Gallery preview</p>
                <div className="grid grid-cols-3 gap-3">
                  {form.galleryImageUrls.map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt=""
                      className="aspect-square w-full rounded-2xl object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h1 className="font-display text-2xl">Campaign details</h1>
            <div>
              <label className="mb-2 block text-sm font-medium">Faith category</label>
              <div className="grid grid-cols-2 gap-2">
                {faithCategoryOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({ ...current, faithCategory: option.value }))
                    }
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${form.faithCategory === option.value ? "border-amber-400 bg-amber-50 text-amber-800" : "border-border hover:border-amber-200"}`}
                  >
                    <span>{option.icon}</span> {option.label}
                  </button>
                ))}
              </div>
              {errors.faithCategory && (
                <p className="mt-1 text-xs text-destructive">{errors.faithCategory}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Location</label>
              <input
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.location}
                onChange={(event) =>
                  setForm((current) => ({ ...current, location: event.target.value }))
                }
              />
              {errors.location && (
                <p className="mt-1 text-xs text-destructive">{errors.location}</p>
              )}
            </div>
            {!isOngoing && form.type === "MONEY" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Fundraising goal (₦)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="2,500,000"
                  value={form.goalAmount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      goalAmount: formatAmountInput(event.target.value),
                    }))
                  }
                />
                {errors.goalAmount && (
                  <p className="mt-1 text-xs text-destructive">{errors.goalAmount}</p>
                )}
              </div>
            )}
            {!isOngoing && (
              <div>
                <label className="mb-2 block text-sm font-medium">Urgency</label>
                <div className="grid grid-cols-2 gap-2">
                  {urgencyOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({ ...current, urgency: option.value }))
                      }
                      className={`rounded-xl border p-3 text-left transition ${form.urgency === option.value ? "border-amber-400 bg-amber-50" : "border-border hover:border-amber-200"}`}
                    >
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{option.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Link to an org</label>
              <select
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.organizationId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, organizationId: event.target.value }))
                }
              >
                <option value="">No org selected</option>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 4 && isOngoing && (
          <div className="space-y-5">
            <h1 className="font-display text-2xl">Giving frequencies</h1>
            <div className="space-y-3">
              {frequencyOptions.map((option) => {
                const selected = form.frequencies.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        frequencies: selected
                          ? current.frequencies.filter((frequency) => frequency !== option.value)
                          : [...current.frequencies, option.value],
                      }))
                    }
                    className={`flex w-full items-center justify-between rounded-xl border p-4 transition ${selected ? "border-amber-400 bg-amber-50" : "border-border hover:border-amber-200"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Repeat2
                        className={`h-4 w-4 ${selected ? "text-amber-600" : "text-muted-foreground"}`}
                      />
                      <span className="text-sm font-medium">{option.label}</span>
                    </div>
                    {selected && <Check className="h-4 w-4 text-amber-600" />}
                  </button>
                );
              })}
            </div>
            {errors.frequencies && <p className="text-xs text-destructive">{errors.frequencies}</p>}
          </div>
        )}

        {((isOngoing && step === 5) || (!isOngoing && step === 4)) && (
          <div className="space-y-5">
            <h1 className="font-display text-2xl">Preview &amp; publish</h1>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex aspect-[16/9] items-center justify-center bg-muted">
                {form.coverImageUrl ? (
                  <img src={form.coverImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${isOngoing ? "bg-amber-100 text-amber-700" : "bg-muted text-foreground"}`}
                  >
                    {isOngoing ? "Ongoing" : "One-time"}
                  </span>
                  {form.faithCategory && (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
                      {
                        faithCategoryOptions.find(
                          (option) => option.value === form.faithCategory,
                        )?.label
                      }
                    </span>
                  )}
                </div>
                <h2 className="font-display text-xl">{form.title}</h2>
                <p className="line-clamp-3 text-sm text-muted-foreground">{form.story}</p>
                {!isOngoing && form.goalAmount && (
                  <div className="text-sm">
                    Goal: <span className="font-semibold">₦{parseAmountInput(form.goalAmount).toLocaleString()}</span>
                  </div>
                )}
                {isOngoing && form.frequencies.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Give: {form.frequencies.join(" · ")}
                  </div>
                )}
                {form.galleryImageUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {form.galleryImageUrls.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt=""
                        className="aspect-square w-full rounded-2xl object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep((value) => value - 1)}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-muted"
            >
              Back
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={() => saveDraftMutation.mutate()}
              disabled={
                saveDraftMutation.isPending ||
                submitDraftMutation.isPending ||
                createCampaignMutation.isPending ||
                uploadCoverMutation.isPending ||
                uploadGalleryMutation.isPending
              }
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-60"
            >
              {saveDraftMutation.isPending ? "Saving draft..." : "Save draft"}
            </button>
            {step < stepLabels.length - 1 ? (
              <button
                onClick={next}
                className="rounded-full bg-amber-500 px-7 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={() => {
                  if (draftId) {
                    submitDraftMutation.mutate();
                    return;
                  }

                  createCampaignMutation.mutate();
                }}
                disabled={
                  createCampaignMutation.isPending ||
                  submitDraftMutation.isPending ||
                  uploadCoverMutation.isPending ||
                  uploadGalleryMutation.isPending
                }
                className="rounded-full bg-amber-500 px-7 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
              >
                {draftId
                  ? submitDraftMutation.isPending
                    ? "Submitting..."
                    : "Submit for review"
                  : createCampaignMutation.isPending
                    ? "Submitting..."
                    : "Submit for review"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
