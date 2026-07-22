import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Baby, Check, Church, FileText, Globe, GraduationCap, ImagePlus, Link2, Loader2, Trash2, Users } from "lucide-react";

import { Navbar } from "@/components/Navbar";
import {
  createOrganization,
  getCloudinaryStatus,
  getOrganizationDraft,
  saveOrganizationDraft,
  submitOrganizationDraft,
  updateOrganizationDraft,
  uploadMedia,
} from "@/features/catalog/api";
import { orgCategoryOptions } from "@/lib/catalog";
import { useRequireAuth } from "@/lib/useRequireAuth";

export const Route = createFileRoute("/register-org")({
  component: RegisterOrg,
});

const orgIcons = {
  CHURCH: Church,
  MISSION: Globe,
  ORPHANAGE: Baby,
  SCHOOL: GraduationCap,
  OTHER: Users,
} as const;

function isValidPublicUrl(value: string) {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function RegisterOrg() {
  const isAuthed = useRequireAuth();
  const nav = useNavigate();
  const draftId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("draftId") ?? undefined
      : undefined;
  const queryClient = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const {
    data: mediaStatus,
    isLoading: mediaStatusLoading,
    isError: mediaStatusError,
  } = useQuery({
    queryKey: ["media", "cloudinary-status"],
    queryFn: getCloudinaryStatus,
  });
  const { data: draft } = useQuery({
    queryKey: ["organization-draft", draftId],
    queryFn: () => getOrganizationDraft(draftId!),
    enabled: isAuthed && Boolean(draftId),
  });

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    category: "" as "CHURCH" | "MISSION" | "ORPHANAGE" | "SCHOOL" | "OTHER" | "",
    otherCategoryLabel: "",
    denomination: "",
    foundedYear: "",
    location: "",
    tagline: "",
    bio: "",
    photoUrls: [] as string[],
    externalLinks: [] as string[],
    registrationDocumentUrls: [] as string[],
  });
  const [externalLinkInput, setExternalLinkInput] = useState("");

  const addExternalLink = () => {
    const next = externalLinkInput.trim();
    if (!next) {
      return;
    }
    if (!isValidPublicUrl(next)) {
      toast.error("Paste a valid public link starting with http:// or https://.");
      return;
    }
    if (form.externalLinks.includes(next)) {
      toast.error("That public link has already been added.");
      return;
    }
    if (form.externalLinks.length >= 10) {
      toast.error("You can add up to 10 public links.");
      return;
    }

    setForm((current) => ({
      ...current,
      externalLinks: [...current.externalLinks, next],
    }));
    setExternalLinkInput("");
  };

  const countWords = (value: string) =>
    value.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    if (!draft) return;
    setForm({
      name: draft.name,
      category: draft.category.toUpperCase() as "CHURCH" | "MISSION" | "ORPHANAGE" | "SCHOOL" | "OTHER",
      otherCategoryLabel: draft.otherCategoryLabel || "",
      denomination: draft.denomination,
      foundedYear: draft.founded || "",
      location: draft.location,
      tagline: draft.tagline,
      bio: draft.bio,
      photoUrls: draft.photos,
      externalLinks: draft.links,
      registrationDocumentUrls: draft.registrationDocuments,
    });
  }, [draft]);

  const uploadPhotosMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploads = await Promise.all(
        files.map((file) =>
          uploadMedia({
            file,
            folder: "organization-photo",
            entityId: form.name.trim() || undefined,
          }),
        ),
      );

      return uploads.map((upload) => upload.url);
    },
    onSuccess: (urls) => {
      setForm((current) => ({
        ...current,
        photoUrls: [...current.photoUrls, ...urls],
      }));
      toast.success(`${urls.length} photo${urls.length > 1 ? "s" : ""} uploaded.`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const createOrgMutation = useMutation({
    mutationFn: () =>
      createOrganization({
        name: form.name,
        tagline: form.tagline,
        category: form.category || "OTHER",
        otherCategoryLabel:
          form.category === "OTHER" ? form.otherCategoryLabel.trim() : undefined,
        denomination: form.denomination,
        foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
        location: form.location,
        bio: form.bio,
        photoUrls: form.photoUrls,
        externalLinks: form.externalLinks,
        registrationDocumentUrls: form.registrationDocumentUrls,
      }),
    onSuccess: (organization) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organization-drafts"] });
      toast.success("Organization created successfully.");
      nav({ to: "/org/$id", params: { id: organization.id } });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        tagline: form.tagline,
        category: form.category || undefined,
        otherCategoryLabel:
          form.category === "OTHER" ? form.otherCategoryLabel.trim() : undefined,
        denomination: form.denomination,
        foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
        location: form.location,
        bio: form.bio,
        photoUrls: form.photoUrls,
        externalLinks: form.externalLinks,
        registrationDocumentUrls: form.registrationDocumentUrls,
      };

      return draftId
        ? updateOrganizationDraft(draftId, payload)
        : saveOrganizationDraft(payload);
    },
    onSuccess: async (organization) => {
      queryClient.invalidateQueries({ queryKey: ["organization-drafts"] });
      toast.success("Organization draft saved.");

      if (!draftId) {
        await nav({
          to: "/register-org",
          search: { draftId: organization.id },
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
        throw new Error("No organization draft selected.");
      }

      await updateOrganizationDraft(draftId, {
        name: form.name,
        tagline: form.tagline,
        category: form.category || undefined,
        otherCategoryLabel:
          form.category === "OTHER" ? form.otherCategoryLabel.trim() : undefined,
        denomination: form.denomination,
        foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
        location: form.location,
        bio: form.bio,
        photoUrls: form.photoUrls,
        externalLinks: form.externalLinks,
        registrationDocumentUrls: form.registrationDocumentUrls,
      });

      return submitOrganizationDraft(draftId);
    },
    onSuccess: (organization) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organization-drafts"] });
      toast.success("Organization submitted for review.");
      nav({ to: "/org/$id", params: { id: organization.id } });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const steps = ["Details", "Mission", "Media", "Preview"];

  const uploadDocumentsMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploads = await Promise.all(
        files.map((file) =>
          uploadMedia({
            file,
            folder: "organization-document",
            entityId: form.name.trim() || undefined,
          }),
        ),
      );

      return uploads.map((upload) => upload.url);
    },
    onSuccess: (urls) => {
      setForm((current) => ({
        ...current,
        registrationDocumentUrls: [...current.registrationDocumentUrls, ...urls],
      }));
      toast.success(`${urls.length} document${urls.length > 1 ? "s" : ""} uploaded.`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const openPhotoPicker = () => {
    if (uploadPhotosMutation.isPending || uploadDocumentsMutation.isPending) return;

    if (!mediaStatus?.enabled) {
      if (mediaStatusLoading) {
        toast.error("Checking media upload connection. Try again in a moment.");
        return;
      }

      if (mediaStatusError) {
        toast.error("Could not confirm media upload setup. Refresh and try again.");
        return;
      }

      const missing = mediaStatus?.missing?.join(", ");
      toast.error(
        missing
          ? `Media upload is not configured yet: ${missing}`
          : "Media upload is not configured yet.",
      );
      return;
    }

    photoInputRef.current?.click();
  };

  const openDocumentPicker = () => {
    if (uploadPhotosMutation.isPending || uploadDocumentsMutation.isPending) return;

    if (!mediaStatus?.enabled) {
      if (mediaStatusLoading) {
        toast.error("Checking media upload connection. Try again in a moment.");
        return;
      }

      if (mediaStatusError) {
        toast.error("Could not confirm media upload setup. Refresh and try again.");
        return;
      }

      const missing = mediaStatus?.missing?.join(", ");
      toast.error(
        missing
          ? `Media upload is not configured yet: ${missing}`
          : "Media upload is not configured yet.",
      );
      return;
    }

    documentInputRef.current?.click();
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (step === 0) {
      if (!form.name.trim()) nextErrors.name = "Organisation name is required";
      if (form.name.trim().length > 120) nextErrors.name = "Organisation name cannot exceed 120 characters";
      if (!form.category) nextErrors.category = "Select a category";
      if (form.category === "OTHER" && form.otherCategoryLabel.trim().length < 2) {
        nextErrors.otherCategoryLabel = "Specify the ministry type";
      }
      if (!form.denomination.trim()) nextErrors.denomination = "Denomination or tradition is required";
      if (form.foundedYear && !/^\d{4}$/.test(form.foundedYear)) {
        nextErrors.foundedYear = "Enter a valid 4-digit year";
      }
      if (!form.location.trim()) nextErrors.location = "Location is required";
    }
    if (step === 1) {
      if (form.tagline.trim().length < 10) nextErrors.tagline = "Add a short tagline (at least 10 characters)";
      if (form.tagline.trim().length > 200) nextErrors.tagline = "Tagline cannot exceed 200 characters";
      if (countWords(form.bio) < 100) nextErrors.bio = "Tell us more about your org in at least 100 words";
    }
    if (step === 2) {
      if (form.photoUrls.length < 3) nextErrors.photoUrls = "Upload at least 3 organization photos";
      if (form.registrationDocumentUrls.length < 1) {
        nextErrors.registrationDocumentUrls =
          "Upload a CAC registration document or recommendation letter";
      }
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
        <div className="mx-auto max-w-xl px-5 py-10">
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-xl px-5 py-10">
        <div className="mb-8 flex items-center gap-2">
          {steps.map((label, index) => (
            <div key={label} className="flex flex-1 items-center gap-2 last:flex-none">
              <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${index <= step ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}>
                {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </div>
              <span className={`hidden text-xs sm:block ${index === step ? "font-medium text-foreground" : "text-muted-foreground"}`}>{label}</span>
              {index < steps.length - 1 && <div className={`h-px flex-1 ${index < step ? "bg-amber-400" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {draftId ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You are editing a saved organization draft. Save as you go, then submit when everything is ready.
          </div>
        ) : null}

        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-2xl">Tell us about your org</h1>
              <p className="mt-1 text-sm text-muted-foreground">Basic information donors will see on your profile.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Organisation name</label>
              <input className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Category</label>
              <div className="grid gap-2">
                {orgCategoryOptions.map((option) => {
                  const Icon = orgIcons[option.value];
                  return (
                    <button key={option.value} type="button" onClick={() => setForm((current) => ({ ...current, category: option.value }))} className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${form.category === option.value ? "border-amber-400 bg-amber-50" : "border-border hover:border-amber-200"}`}>
                      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${form.category === option.value ? "bg-amber-100" : "bg-muted"}`}>
                        <Icon className={`h-4.5 w-4.5 ${form.category === option.value ? "text-amber-600" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{option.label}</div>
                      </div>
                      {form.category === option.value && <Check className="ml-auto h-4 w-4 text-amber-600" />}
                    </button>
                  );
                })}
              </div>
              {errors.category && <p className="mt-1 text-xs text-destructive">{errors.category}</p>}
            </div>
            {form.category === "OTHER" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Specify ministry type</label>
                <input
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="e.g. Prayer ministry, campus fellowship, outreach hub"
                  value={form.otherCategoryLabel}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, otherCategoryLabel: event.target.value }))
                  }
                />
                {errors.otherCategoryLabel && (
                  <p className="mt-1 text-xs text-destructive">{errors.otherCategoryLabel}</p>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Denomination / tradition</label>
                <input className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" value={form.denomination} onChange={(event) => setForm((current) => ({ ...current, denomination: event.target.value }))} />
                {errors.denomination && <p className="mt-1 text-xs text-destructive">{errors.denomination}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Year founded</label>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={form.foundedYear}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      foundedYear: event.target.value.replace(/\D/g, "").slice(0, 4),
                    }))
                  }
                />
                {errors.foundedYear && <p className="mt-1 text-xs text-destructive">{errors.foundedYear}</p>}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Location</label>
              <input className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
              {errors.location && <p className="mt-1 text-xs text-destructive">{errors.location}</p>}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-2xl">Your mission</h1>
              <p className="mt-1 text-sm text-muted-foreground">Help donors understand who you are and what you do.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tagline</label>
              <input className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" value={form.tagline} onChange={(event) => setForm((current) => ({ ...current, tagline: event.target.value }))} />
              <div className="mt-1 flex items-center justify-between">
                {errors.tagline ? <p className="text-xs text-destructive">{errors.tagline}</p> : <span />}
                <span className="text-xs text-muted-foreground">{form.tagline.length}/200</span>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">About your org</label>
              <textarea rows={6} className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} />
              <div className="mt-1 flex items-center justify-between">
                {errors.bio ? <p className="text-xs text-destructive">{errors.bio}</p> : <span />}
                <span className="text-xs text-muted-foreground">{countWords(form.bio)} words</span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-2xl">Add photos, links &amp; proof</h1>
              <p className="mt-1 text-sm text-muted-foreground">Show donors the work, share relevant public links, and upload registration evidence for admin review.</p>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length > 0) {
                  uploadPhotosMutation.mutate(files);
                }
                event.target.value = "";
              }}
            />
            <input
              ref={documentInputRef}
              type="file"
              accept="image/*,.pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length > 0) {
                  uploadDocumentsMutation.mutate(files);
                }
                event.target.value = "";
              }}
            />
            <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
              <ImagePlus className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">Upload organization photos</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {mediaStatusLoading
                  ? "Checking Cloudinary connection..."
                  : mediaStatus?.enabled
                    ? "Images will be stored in Cloudinary under AzarFaith organization folders."
                    : mediaStatusError
                      ? "Could not confirm Cloudinary status. You can retry the button after refresh."
                      : `Uploads are unavailable until these credentials are set: ${(mediaStatus?.missing ?? []).join(", ") || "CLOUDINARY_*"}`}
              </p>
              <button
                type="button"
                onClick={openPhotoPicker}
                disabled={uploadPhotosMutation.isPending}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadPhotosMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                {uploadPhotosMutation.isPending ? "Uploading..." : "Choose photos"}
              </button>
              {errors.photoUrls && <p className="mt-3 text-xs text-destructive">{errors.photoUrls}</p>}
            </div>
            <div className="rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Registration evidence</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Upload a CAC registration document or a recommendation letter from a recognized parent ministry.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openDocumentPicker}
                  disabled={uploadDocumentsMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadDocumentsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  {uploadDocumentsMutation.isPending ? "Uploading..." : "Add document"}
                </button>
              </div>
              {errors.registrationDocumentUrls && (
                <p className="mt-3 text-xs text-destructive">{errors.registrationDocumentUrls}</p>
              )}
              {form.registrationDocumentUrls.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {form.registrationDocumentUrls.map((url) => (
                    <div key={url} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-xs">
                      <a href={url} target="_blank" rel="noreferrer" className="truncate text-amber-700 hover:underline">
                        {url}
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            registrationDocumentUrls: current.registrationDocumentUrls.filter((item) => item !== url),
                          }))
                        }
                        className="text-muted-foreground transition hover:text-foreground"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">No registration or recommendation documents uploaded yet.</p>
              )}
            </div>
            {(form.externalLinks.length > 0 || form.photoUrls.length > 0) && (
              <div className="space-y-3">
                {form.photoUrls.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Uploaded photos</p>
                    <div className="grid grid-cols-3 gap-3">
                      {form.photoUrls.map((url) => (
                        <img key={url} src={url} alt="" className="aspect-square w-full rounded-2xl object-cover" />
                      ))}
                    </div>
                  </div>
                )}
                {form.externalLinks.length > 0 && (
                  <div className="space-y-1">
                    {form.externalLinks.map((url) => <div key={url} className="truncate rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{url}</div>)}
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Relevant public links</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="https://your-website-or-social-link"
                  value={externalLinkInput}
                  onChange={(event) => setExternalLinkInput(event.target.value)}
                />
                <button
                  type="button"
                  onClick={addExternalLink}
                  className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-600"
                >
                  Add link
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Add one real public URL at a time, then use Add link for another one or remove any you no longer want.
              </p>
              {form.externalLinks.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {form.externalLinks.map((url, index) => (
                    <div
                      key={url}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-xs"
                    >
                      <span className="truncate text-muted-foreground">
                        Link {index + 1}: {url}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            externalLinks: current.externalLinks.filter((item) => item !== url),
                          }))
                        }
                        className="text-amber-700 transition hover:text-amber-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-2xl">Review before publishing</h1>
              <p className="mt-1 text-sm text-muted-foreground">Your organization will be submitted for admin review after this step.</p>
            </div>
            <div className="space-y-3 rounded-2xl border border-border bg-card p-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-display text-xl">{form.name}</span>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-700">
                  {form.category === "OTHER"
                    ? form.otherCategoryLabel || "other"
                    : form.category || "other"}
                </span>
              </div>
              <p className="italic text-muted-foreground">{form.tagline}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{form.denomination}</span>
                <span>·</span>
                <span>{form.location}</span>
                {form.foundedYear && <><span>·</span><span>Est. {form.foundedYear}</span></>}
              </div>
              <p className="leading-relaxed">{form.bio}</p>
              {form.photoUrls[0] && <img src={form.photoUrls[0]} alt="" className="h-52 w-full rounded-2xl object-cover" />}
              {form.externalLinks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Public links</p>
                  <div className="flex flex-wrap gap-2">
                    {form.externalLinks.map((url) => (
                      <span key={url} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        <Link2 className="h-3 w-3" />
                        {url}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {form.registrationDocumentUrls.length} verification document{form.registrationDocumentUrls.length === 1 ? "" : "s"} attached for admin review.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Once submitted, your organization page will show a <strong>pending review</strong> label until the AzarFaith team verifies it.
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          {step > 0 ? (
            <button onClick={() => setStep((value) => value - 1)} className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-muted">
              Back
            </button>
          ) : <span />}
          <div className="flex items-center gap-3">
            <button
              onClick={() => saveDraftMutation.mutate()}
              disabled={
                saveDraftMutation.isPending ||
                submitDraftMutation.isPending ||
                createOrgMutation.isPending ||
                uploadPhotosMutation.isPending ||
                uploadDocumentsMutation.isPending
              }
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-60"
            >
              {saveDraftMutation.isPending ? "Saving draft..." : "Save draft"}
            </button>
            {step < steps.length - 1 ? (
              <button onClick={next} className="rounded-full bg-amber-500 px-7 py-3 text-sm font-semibold text-white transition hover:bg-amber-600">
                Continue
              </button>
            ) : (
              <button
                onClick={() => {
                  if (draftId) {
                    submitDraftMutation.mutate();
                    return;
                  }

                  createOrgMutation.mutate();
                }}
                disabled={
                  createOrgMutation.isPending ||
                  submitDraftMutation.isPending ||
                  uploadPhotosMutation.isPending ||
                  uploadDocumentsMutation.isPending
                }
                className="rounded-full bg-amber-500 px-7 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
              >
                {draftId
                  ? submitDraftMutation.isPending
                    ? "Submitting..."
                    : "Submit for review"
                  : createOrgMutation.isPending
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
