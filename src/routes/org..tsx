import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Calendar, FileText, Heart, ImagePlus, Link2, Loader2, MapPin, Repeat2, ShieldCheck, Target, X } from "lucide-react";
import { toast } from "sonner";

import { useAppSelector } from "@/app/hooks";
import { Navbar } from "@/components/Navbar";
import { PageSpinner } from "@/components/PageSpinner";
import {
  getCloudinaryStatus,
  getOrganization,
  getOrganizationPayoutSummary,
  getPayoutBanks,
  getProfile,
  resolvePayoutAccount,
  submitOrganizationDraft,
  updateOrganization,
  upsertOrganizationPayoutAccount,
  uploadMedia,
} from "@/features/catalog/api";
import { formatMoney, orgCategoryOptions } from "@/lib/catalog";

export const Route = createFileRoute("/org/")({
  component: OrgProfile,
});

function OrgProfile() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const { data: org, isLoading } = useQuery({
    queryKey: ["organization", id],
    queryFn: () => getOrganization(id),
  });
  const {
    data: mediaStatus,
    isLoading: mediaStatusLoading,
    isError: mediaStatusError,
  } = useQuery({
    queryKey: ["media", "cloudinary-status"],
    queryFn: getCloudinaryStatus,
  });
  const { user, hydrated } = useAppSelector((state) => state.auth);
  const { data: viewer } = useQuery({
    queryKey: ["profile", "viewer"],
    queryFn: getProfile,
    enabled: hydrated && Boolean(user),
  });
  const { data: payoutBanks } = useQuery({
    queryKey: ["payout-banks"],
    queryFn: getPayoutBanks,
    enabled: hydrated && Boolean(user),
  });
  const { data: payoutSummary } = useQuery({
    queryKey: ["organization", id, "payout-summary"],
    queryFn: () => getOrganizationPayoutSummary(id),
    enabled: hydrated && Boolean(user),
  });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    tagline: "",
    category: "" as "CHURCH" | "MISSION" | "ORPHANAGE" | "SCHOOL" | "OTHER" | "",
    otherCategoryLabel: "",
    denomination: "",
    foundedYear: "",
    location: "",
    bio: "",
    photoUrls: [] as string[],
    externalLinks: [] as string[],
    registrationDocumentUrls: [] as string[],
  });
  const [externalLinkInput, setExternalLinkInput] = useState("");
  const [payoutBankCode, setPayoutBankCode] = useState("");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState("");
  const [payoutAccountHolderName, setPayoutAccountHolderName] = useState("");
  const [resolvedPayoutAccountName, setResolvedPayoutAccountName] = useState("");
  const [resolveError, setResolveError] = useState("");
  const isOwner = viewer?.id === org?.ownerId;
  const countWords = (value: string) =>
    value.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    if (!org) return;
    setForm({
      name: org.name,
      tagline: org.tagline,
      category: org.category.toUpperCase() as "CHURCH" | "MISSION" | "ORPHANAGE" | "SCHOOL" | "OTHER",
      otherCategoryLabel: org.otherCategoryLabel || "",
      denomination: org.denomination,
      foundedYear: org.founded || "",
      location: org.location,
      bio: org.bio,
      photoUrls: org.photos,
      externalLinks: org.links,
      registrationDocumentUrls: org.registrationDocuments,
    });
  }, [org]);

  useEffect(() => {
    if (!payoutSummary?.payoutAccount) return;
    setPayoutBankCode(payoutSummary.payoutAccount.bankCode);
    setPayoutAccountHolderName(payoutSummary.payoutAccount.accountHolderName);
    setResolvedPayoutAccountName(payoutSummary.payoutAccount.accountName);
  }, [payoutSummary]);

  useEffect(() => {
    if (!isOwner || !payoutBankCode || payoutAccountNumber.length !== 10) {
      setResolveError("");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      resolvePayoutMutation.mutate();
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [isOwner, payoutBankCode, payoutAccountNumber]);

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
    onError: (error: Error) => toast.error(error.message),
  });

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
    onError: (error: Error) => toast.error(error.message),
  });

  const updateOrganizationMutation = useMutation({
    mutationFn: () =>
      updateOrganization(id, {
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
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", id] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditing(false);
      toast.success("Organization updated.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const resubmitOrganizationMutation = useMutation({
    mutationFn: () => submitOrganizationDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", id] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Organization resubmitted for review.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const resolvePayoutMutation = useMutation({
    mutationFn: () =>
      resolvePayoutAccount({
        bankCode: payoutBankCode,
        accountNumber: payoutAccountNumber,
      }),
    onSuccess: (response) => {
      setResolvedPayoutAccountName(response.accountName);
      setResolveError("");
    },
    onError: (error: Error) => {
      setResolveError(
        error.message ||
          "Paystack could not confirm this account right now. You can still save it manually as pending.",
      );
    },
  });
  const savePayoutMutation = useMutation({
    mutationFn: () =>
      upsertOrganizationPayoutAccount(id, {
        accountHolderName: payoutAccountHolderName.trim(),
        bankCode: payoutBankCode,
        accountNumber: payoutAccountNumber,
        accountName:
          resolvedPayoutAccountName.trim() || payoutAccountHolderName.trim(),
      }),
    onSuccess: (response) => {
      setResolvedPayoutAccountName(response.accountName);
      queryClient.invalidateQueries({ queryKey: ["organization", id, "payout-summary"] });
      toast.success(
        response.status === "verified"
          ? "Payout account saved. This organization can now use your verified profile payout destination."
          : "Payout account saved. Your profile payout destination is still the default until this extra organization payout setup is verified.",
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!isLoading && !org) throw notFound();
  if (!org) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageSpinner label="Loading organization..." />
      </div>
    );
  }

  const ongoing = org.campaigns.filter((campaign) => campaign.mode === "ongoing");
  const oneTime = org.campaigns.filter((campaign) => campaign.mode === "one-time");
  const isRejected =
    org.verificationStatus === "unverified" && org.reviewAction === "rejected";
  const canResubmitNow =
    !org.nextReapplicationAt ||
    new Date(org.nextReapplicationAt).getTime() <= Date.now();
  const criticalIdentityChanged =
    org.verificationStatus === "verified" &&
    (form.name.trim() !== org.name || form.category !== org.category.toUpperCase());
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
    toast.error("Media upload is not configured yet.");
    return false;
  };
  const validateOrganizationEdit = () => {
    if (!form.name.trim()) {
      toast.error("Organization name is required.");
      return false;
    }
    if (form.name.trim().length > 120) {
      toast.error("Organization name cannot exceed 120 characters.");
      return false;
    }
    if (form.tagline.trim().length < 10) {
      toast.error("Tagline must be at least 10 characters.");
      return false;
    }
    if (form.tagline.trim().length > 200) {
      toast.error("Tagline cannot exceed 200 characters.");
      return false;
    }
    if (countWords(form.bio) < 100) {
      toast.error("Organization bio must be at least 100 words.");
      return false;
    }
    if (form.photoUrls.length < 3) {
      toast.error("Keep at least 3 organization photos on the profile.");
      return false;
    }
    if (form.category === "OTHER" && form.otherCategoryLabel.trim().length < 2) {
      toast.error("Specify the ministry type for Other.");
      return false;
    }
    if (form.foundedYear && !/^\d{4}$/.test(form.foundedYear)) {
      toast.error("Enter a valid 4-digit founded year.");
      return false;
    }
    if (form.registrationDocumentUrls.length < 1) {
      toast.error("Keep at least one registration document or recommendation letter.");
      return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative">
        {org.photos[0] && (
          <div className="h-56 overflow-hidden md:h-72">
            <img src={org.photos[0]} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        )}
        <div className="relative mx-auto max-w-3xl px-5 pb-8 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">{org.category}</span>
                {org.verificationStatus === "verified" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-trust">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                ) : org.verificationStatus === "pending" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                    Pending review
                  </span>
                ) : org.verificationStatus === "unverified" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
                    Unverified
                  </span>
                ) : null}
              </div>
              <h1 className="font-display text-3xl md:text-4xl">{org.name}</h1>
              <p className="mt-1 text-muted-foreground">{org.tagline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {org.location}</span>
                {org.founded && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Est. {org.founded}</span>}
                <span>{org.category === "other" && org.otherCategoryLabel ? org.otherCategoryLabel : org.denomination}</span>
              </div>
            </div>
            <div className="flex gap-3">
              {ongoing[0] && (
                <Link to="/campaign/$id" params={{ id: ongoing[0].id }} className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600">
                  <Repeat2 className="h-4 w-4" /> Give monthly
                </Link>
              )}
              {oneTime[0] && (
                <Link to="/campaign/$id" params={{ id: oneTime[0].id }} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-muted">
                  Give once
                </Link>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Total received", value: formatMoney(org.totalReceived) },
              { label: "Supporters", value: org.supporters.toLocaleString() },
              { label: "Active campaigns", value: org.campaignCount.toString() },
              { label: "Founded", value: org.founded || "-" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-card p-4 text-center">
                <div className="font-display text-xl">{item.value}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-12 px-5 pb-16 md:px-8">
        {isOwner ? (
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Manage organization
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep this organization profile current for donors and reviewers.
                </p>
                {isRejected ? (
                  <p className="mt-2 text-xs text-rose-700">
                    This organization was rejected during admin review. Update the profile if needed, then resubmit it when eligible.
                  </p>
                ) : null}
                {criticalIdentityChanged ? (
                  <p className="mt-2 text-xs text-amber-700">
                    Changing the organization name or category will send this profile back into admin review.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {isRejected ? (
                  <button
                    onClick={() => resubmitOrganizationMutation.mutate()}
                    disabled={!canResubmitNow || resubmitOrganizationMutation.isPending}
                    className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resubmitOrganizationMutation.isPending
                      ? "Resubmitting..."
                      : canResubmitNow
                        ? "Resubmit for review"
                        : `Available ${org.nextReapplicationAt ? new Date(org.nextReapplicationAt).toLocaleDateString() : "later"}`}
                  </button>
                ) : null}
                <button
                  onClick={() => setEditing((current) => !current)}
                  className="rounded-full border border-border px-4 py-2 text-xs font-medium transition hover:bg-muted"
                >
                  {editing ? "Close" : "Edit profile"}
                </button>
              </div>
            </div>

            {editing ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    if (files.length > 0) uploadPhotosMutation.mutate(files);
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
                    if (files.length > 0) uploadDocumentsMutation.mutate(files);
                    event.target.value = "";
                  }}
                />
                <Field label="Organization name" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
                <Field label="Tagline" value={form.tagline} onChange={(value) => setForm((current) => ({ ...current, tagline: value }))} />
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Category</label>
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value as typeof current.category,
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {orgCategoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {form.category === "OTHER" ? (
                  <Field
                    label="Specify ministry type"
                    value={form.otherCategoryLabel}
                    onChange={(value) => setForm((current) => ({ ...current, otherCategoryLabel: value }))}
                  />
                ) : null}
                <Field label="Denomination / tradition" value={form.denomination} onChange={(value) => setForm((current) => ({ ...current, denomination: value }))} />
                <Field
                  label="Year founded"
                  value={form.foundedYear}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      foundedYear: value.replace(/\D/g, "").slice(0, 4),
                    }))
                  }
                />
                <Field label="Location" value={form.location} onChange={(value) => setForm((current) => ({ ...current, location: value }))} />
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">About</label>
                  <textarea
                    rows={5}
                    value={form.bio}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, bio: event.target.value }))
                    }
                    className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div className="md:col-span-2 space-y-3 rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Organization photos</p>
                      <p className="text-xs text-muted-foreground">Add or remove gallery photos for this profile.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!ensureMediaReady()) return;
                        photoInputRef.current?.click();
                      }}
                      disabled={uploadPhotosMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium transition hover:bg-muted disabled:opacity-60"
                    >
                      {uploadPhotosMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                      {uploadPhotosMutation.isPending ? "Uploading..." : "Add photos"}
                    </button>
                  </div>
                  {form.photoUrls.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {form.photoUrls.map((photo) => (
                        <div key={photo} className="relative">
                          <img src={photo} alt="" className="aspect-square w-full rounded-2xl object-cover" />
                          <button
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                photoUrls: current.photoUrls.filter((item) => item !== photo),
                              }))
                            }
                            className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No photos uploaded yet.</p>
                  )}
                </div>
                <div className="md:col-span-2 space-y-3 rounded-2xl border border-border p-4">
                  <p className="text-sm font-medium">Public links</p>
                  <div className="flex gap-2">
                    <input
                      value={externalLinkInput}
                      onChange={(event) => setExternalLinkInput(event.target.value)}
                      placeholder="https://website-or-social-link"
                      className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = externalLinkInput.trim();
                        if (!next) return;
                        setForm((current) => ({
                          ...current,
                          externalLinks: [...current.externalLinks, next],
                        }));
                        setExternalLinkInput("");
                      }}
                      className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-600"
                    >
                      Add
                    </button>
                  </div>
                  {form.externalLinks.length > 0 ? (
                    <div className="space-y-2">
                      {form.externalLinks.map((url) => (
                        <div key={url} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-xs">
                          <span className="truncate text-muted-foreground">{url}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                externalLinks: current.externalLinks.filter((item) => item !== url),
                              }))
                            }
                            className="text-amber-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No public links added yet.</p>
                  )}
                </div>
                <div className="md:col-span-2 space-y-3 rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Registration evidence</p>
                      <p className="text-xs text-muted-foreground">CAC registration document or recommendation letter for admin review.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!ensureMediaReady()) return;
                        documentInputRef.current?.click();
                      }}
                      disabled={uploadDocumentsMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium transition hover:bg-muted disabled:opacity-60"
                    >
                      {uploadDocumentsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                      {uploadDocumentsMutation.isPending ? "Uploading..." : "Add document"}
                    </button>
                  </div>
                  {form.registrationDocumentUrls.length > 0 ? (
                    <div className="space-y-2">
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
                            className="text-amber-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No registration evidence uploaded yet.</p>
                  )}
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    onClick={() => {
                      if (!validateOrganizationEdit()) return;
                      updateOrganizationMutation.mutate();
                    }}
                    disabled={updateOrganizationMutation.isPending}
                    className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
                  >
                    {updateOrganizationMutation.isPending ? "Saving..." : "Save organization"}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                    Organization payout destination
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This organization uses your profile payout account by default. Add a separate organization-specific payout account only if you want a different destination for this organization.
                  </p>
                </div>
                {payoutSummary?.payoutAccount ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    {payoutSummary.payoutAccount.bankName} · {payoutSummary.payoutAccount.accountNumberMasked}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Bank</label>
                  <select
                    value={payoutBankCode}
                    onChange={(event) => setPayoutBankCode(event.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">Select a bank</option>
                    {(payoutBanks ?? []).map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Account number</label>
                  <input
                    value={payoutAccountNumber}
                    onChange={(event) =>
                      setPayoutAccountNumber(event.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="10-digit account number"
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <Field
                  label="Account holder name"
                  value={payoutAccountHolderName}
                  onChange={setPayoutAccountHolderName}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Beneficiary name</label>
                  <input
                    value={resolvedPayoutAccountName}
                    onChange={(event) => setResolvedPayoutAccountName(event.target.value)}
                    placeholder="Beneficiary account name"
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    AzarFaith will try to confirm this automatically. If Paystack is unavailable, you can still save it manually and it will stay pending. Your profile payout account remains the default unless this organization-specific one is verified.
                  </p>
                </div>
              </div>

              {resolvePayoutMutation.isPending ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Checking account details with Paystack...
                </p>
              ) : null}
              {resolveError ? (
                <p className="mt-3 text-xs text-amber-700">{resolveError}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!payoutBankCode || payoutAccountNumber.length !== 10) {
                      toast.error("Select a bank and enter a valid 10-digit account number.");
                      return;
                    }
                    resolvePayoutMutation.mutate();
                  }}
                  disabled={resolvePayoutMutation.isPending}
                  className="rounded-full border border-border px-4 py-2 text-xs font-medium transition hover:bg-muted disabled:opacity-60"
                >
                  {resolvePayoutMutation.isPending ? "Checking..." : "Retry account check"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      !payoutBankCode ||
                      payoutAccountNumber.length !== 10 ||
                      !payoutAccountHolderName.trim() ||
                      !resolvedPayoutAccountName.trim()
                    ) {
                      toast.error("Complete the organization-specific payout account form before saving.");
                      return;
                    }
                    savePayoutMutation.mutate();
                  }}
                  disabled={savePayoutMutation.isPending}
                  className="rounded-full bg-amber-500 px-5 py-2 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
                >
                  {savePayoutMutation.isPending ? "Saving..." : "Save separate org payout account"}
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="font-display text-2xl">
                    {formatMoney(payoutSummary?.totalCollected ?? 0)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Collected for this organization</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="font-display text-2xl">
                    {formatMoney(payoutSummary?.totalReleased ?? 0)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Already released</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="font-display text-2xl">
                    {formatMoney(payoutSummary?.availableBalance ?? 0)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Available for admin release</p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {org.verificationStatus === "pending" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            This organization is currently under review. Once the AzarFaith team approves it, the verified badge will appear here.
          </div>
        )}
        {isRejected && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <p className="font-medium">This organization is currently unverified.</p>
            <p className="mt-1">
              {org.reviewReason || "The last admin review rejected this organization."}
            </p>
            <p className="mt-2">
              {canResubmitNow
                ? "You can update the details above and resubmit it for review now."
                : `You can reapply from ${org.nextReapplicationAt ? new Date(org.nextReapplicationAt).toLocaleDateString() : "the next eligible date"}.`}
            </p>
          </div>
        )}
        <section>
          <h2 className="mb-3 font-display text-xl">About</h2>
          <p className="leading-relaxed text-muted-foreground">{org.bio}</p>
        </section>

        {org.links.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-xl">Links</h2>
            <div className="flex flex-wrap gap-3">
              {org.links.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-amber-700 transition hover:bg-muted"
                >
                  <Link2 className="h-4 w-4" />
                  {url}
                </a>
              ))}
            </div>
          </section>
        )}

        {org.photos.length > 1 && (
          <section>
            <h2 className="mb-4 font-display text-xl">Gallery</h2>
            <div className="grid grid-cols-3 gap-3">
              {org.photos.map((photo) => (
                <div key={photo} className="aspect-square overflow-hidden rounded-2xl">
                  <img src={photo} alt="" className="h-full w-full object-cover transition duration-300 hover:scale-105" />
                </div>
              ))}
            </div>
          </section>
        )}

        {ongoing.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Repeat2 className="h-5 w-5 text-amber-500" />
              <h2 className="font-display text-xl">Ongoing support</h2>
            </div>
            <div className="space-y-4">
              {ongoing.map((campaign) => (
                <Link key={campaign.id} to="/campaign/$id" params={{ id: campaign.id }} className="group block">
                  <article className="flex gap-4 overflow-hidden rounded-2xl border border-border bg-card transition hover:border-amber-300">
                    <div className="w-28 shrink-0 overflow-hidden">
                      <img src={campaign.cover} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    </div>
                    <div className="flex min-h-[100px] flex-col justify-between py-4 pr-4">
                      <div>
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Ongoing</span>
                          {campaign.frequencies && <span className="text-xs text-muted-foreground">{campaign.frequencies.join(" · ")}</span>}
                        </div>
                        <h3 className="font-display text-base leading-snug line-clamp-2">{campaign.title}</h3>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{campaign.donors} supporters</span>
                        <span className="flex items-center gap-1 font-medium text-amber-600">Give monthly <ArrowRight className="h-3 w-3" /></span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {oneTime.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-500" />
              <h2 className="font-display text-xl">Specific campaigns</h2>
            </div>
            <div className="space-y-4">
              {oneTime.map((campaign) => {
                const pct = campaign.goal ? Math.min(100, Math.round((campaign.raised / campaign.goal) * 100)) : 0;
                return (
                  <Link key={campaign.id} to="/campaign/$id" params={{ id: campaign.id }} className="group block">
                    <article className="flex gap-4 overflow-hidden rounded-2xl border border-border bg-card transition hover:border-amber-300">
                      <div className="w-28 shrink-0 overflow-hidden">
                        <img src={campaign.cover} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      </div>
                      <div className="flex min-h-[100px] flex-col justify-between py-4 pr-4">
                        <h3 className="font-display text-base leading-snug line-clamp-2">{campaign.title}</h3>
                        <div>
                          <div className="mb-1.5 h-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{formatMoney(campaign.raised)}</span>
                            <span className="text-muted-foreground">of {formatMoney(campaign.goal ?? 0)} · {pct}%</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {org.campaigns.length === 0 && (
          <div className="rounded-2xl bg-muted/30 py-12 text-center">
            <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No campaigns yet</p>
            <p className="mt-1 text-sm text-muted-foreground">This org hasn't created any campaigns yet.</p>
            <Link to="/create" className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600">
              Start a campaign
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
    </div>
  );
}
