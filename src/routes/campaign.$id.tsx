import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Flame,
  ImagePlus,
  Loader2,
  MapPin,
  MessageSquare,
  Repeat2,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useAppSelector } from "@/app/hooks";
import { Navbar } from "@/components/Navbar";
import { PageSpinner } from "@/components/PageSpinner";
import {
  createCampaignComment,
  createCampaignUpdate,
  getCloudinaryStatus,
  getCampaign,
  getProfile,
  updateCampaign,
  uploadMedia,
} from "@/features/catalog/api";
import {
  faithCategoryOptions,
  formatAmountInput,
  formatMoney,
  frequencyOptions,
  parseAmountInput,
  urgencyOptions,
} from "@/lib/catalog";

export const Route = createFileRoute("/campaign/$id")({
  component: CampaignRoute,
});

function CampaignRoute() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const [selectedFreq, setSelectedFreq] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateBody, setUpdateBody] = useState("");
  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => getCampaign(id),
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
  const [editForm, setEditForm] = useState({
    title: "",
    story: "",
    faithCategory: "",
    location: "",
    goalAmount: "",
    urgency: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    frequencies: [] as Array<"WEEKLY" | "MONTHLY" | "QUARTERLY">,
    coverImageUrl: "",
    galleryImageUrls: [] as string[],
  });

  useEffect(() => {
    if (!campaign) return;
    setEditForm({
      title: campaign.title,
      story: campaign.story,
      faithCategory:
        faithCategoryOptions.find((option) => option.label === campaign.faithCategory)?.value ??
        "",
      location: campaign.location,
      goalAmount: campaign.goal ? formatAmountInput(String(campaign.goal)) : "",
      urgency: campaign.urgency.toUpperCase() as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      frequencies: (campaign.frequencies ?? []).map((frequency) =>
        frequency.toUpperCase(),
      ) as Array<"WEEKLY" | "MONTHLY" | "QUARTERLY">,
      coverImageUrl: campaign.cover,
      galleryImageUrls: campaign.gallery,
    });
  }, [campaign]);

  const uploadCoverMutation = useMutation({
    mutationFn: async (file: File) =>
      uploadMedia({
        file,
        folder: "campaign-cover",
        entityId: editForm.title.trim() || undefined,
      }),
    onSuccess: (upload) => {
      setEditForm((current) => ({ ...current, coverImageUrl: upload.url }));
      toast.success("Cover image uploaded.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const uploadGalleryMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploads = await Promise.all(
        files.map((file) =>
          uploadMedia({
            file,
            folder: "campaign-gallery",
            entityId: editForm.title.trim() || undefined,
          }),
        ),
      );

      return uploads.map((upload) => upload.url);
    },
    onSuccess: (urls) => {
      setEditForm((current) => ({
        ...current,
        galleryImageUrls: [...current.galleryImageUrls, ...urls],
      }));
      toast.success(`${urls.length} gallery image${urls.length > 1 ? "s" : ""} uploaded.`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateCampaignMutation = useMutation({
    mutationFn: () =>
      updateCampaign(id, {
        title: editForm.title,
        story: editForm.story,
        faithCategory: editForm.faithCategory as
          | "CHURCH_BUILDING"
          | "MISSIONS_OUTREACH"
          | "ORPHANAGE"
          | "EDUCATION"
          | "FOOD_RELIEF"
          | "MEDICAL_MISSION"
          | "EMERGENCY"
          | "COMMUNITY_DEVELOPMENT",
        location: editForm.location,
        goalAmount: campaign?.goal ? parseAmountInput(editForm.goalAmount) : undefined,
        urgency: campaign?.mode === "one-time" ? editForm.urgency : undefined,
        frequencies: campaign?.mode === "ongoing" ? editForm.frequencies : undefined,
        coverImageUrl: editForm.coverImageUrl,
        galleryImageUrls: editForm.galleryImageUrls,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setEditing(false);
      toast.success("Campaign updated.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createCommentMutation = useMutation({
    mutationFn: () => createCampaignComment(id, { body: commentBody }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      setCommentBody("");
      toast.success("Comment posted.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createUpdateMutation = useMutation({
    mutationFn: () => createCampaignUpdate(id, { title: updateTitle, body: updateBody }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setUpdateTitle("");
      setUpdateBody("");
      toast.success("Campaign update published.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!isLoading && !campaign) throw notFound();
  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageSpinner label="Loading campaign..." />
      </div>
    );
  }

  const pct = campaign.goal ? Math.min(100, Math.round((campaign.raised / campaign.goal) * 100)) : null;
  const isOngoing = campaign.mode === "ongoing";
  const visibleUpdates = showAllUpdates ? campaign.updates : campaign.updates.slice(0, 1);
  const donateFreq = selectedFreq ?? (isOngoing ? "monthly" : "once");
  const isOwner = viewer?.id === campaign.ownerId;
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl space-y-8 px-5 py-8 md:px-8">
        <div className="relative aspect-[16/9] overflow-hidden rounded-3xl">
          <img src={campaign.cover} alt="" className="h-full w-full object-cover" />
          <div className="absolute left-4 top-4 flex gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${isOngoing ? "bg-amber-100 text-amber-800" : "border border-border/60 bg-card/90 text-foreground"}`}>
              {isOngoing ? <><Repeat2 className="h-3.5 w-3.5" /> Ongoing</> : <><Target className="h-3.5 w-3.5" /> One-time</>}
            </span>
            {campaign.verificationStatus === "verified" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-trust px-3 py-1.5 text-xs font-medium text-trust-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
            {campaign.urgency === "critical" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-urgent px-3 py-1.5 text-xs font-medium text-urgent-foreground">
                <Flame className="h-3.5 w-3.5" /> Urgent
              </span>
            )}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-amber-600">{campaign.faithCategory}</p>
          <h1 className="font-display text-2xl leading-tight md:text-3xl">{campaign.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div>{campaign.raiser.name}</div>
            <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {campaign.location}</div>
          </div>
          {campaign.orgId && (
            <Link to="/org/$id" params={{ id: campaign.orgId }} className="mt-3 inline-flex items-center gap-2 text-sm text-amber-600 transition hover:text-amber-700">
              View organization <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          {isOngoing ? (
            <div>
              <h2 className="mb-1 font-display text-lg">Support this ministry</h2>
              <p className="mb-4 text-sm text-muted-foreground">Choose how you'd like to give. You can change or cancel anytime.</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {(campaign.frequencies ?? ["monthly"]).map((freq) => (
                  <button key={freq} onClick={() => setSelectedFreq(freq)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedFreq === freq ? "bg-amber-500 text-white" : "border border-border hover:border-amber-300"}`}>
                    Give {freq}
                  </button>
                ))}
                <button onClick={() => setSelectedFreq("once")} className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedFreq === "once" ? "bg-amber-500 text-white" : "border border-border hover:border-amber-300"}`}>
                  Give once
                </button>
              </div>
              <Link to="/donate/$id" params={{ id: campaign.id }} search={{ freq: donateFreq }} className="block w-full rounded-2xl bg-amber-500 py-3.5 text-center font-semibold text-white transition hover:bg-amber-600">
                Continue to give
              </Link>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span>{campaign.donors.toLocaleString()} supporters</span>
                <span>·</span>
                <span>{formatMoney(campaign.raised)} raised total</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="font-display text-2xl">{formatMoney(campaign.raised)}</span>
                <span className="text-sm text-muted-foreground">of {formatMoney(campaign.goal ?? 0)}</span>
              </div>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct ?? 0}%` }} />
              </div>
              <div className="mb-5 flex items-center gap-4 text-xs text-muted-foreground">
                <span>{pct}% funded</span>
                <span>·</span>
                <span>{campaign.donors.toLocaleString()} donors</span>
              </div>
              <Link to="/donate/$id" params={{ id: campaign.id }} search={{ freq: "once" }} className="block w-full rounded-2xl bg-amber-500 py-3.5 text-center font-semibold text-white transition hover:bg-amber-600">
                Donate now
              </Link>
            </div>
          )}
        </div>

        <section>
          <h2 className="mb-3 font-display text-xl">The story</h2>
          <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{campaign.story}</p>
        </section>

        {isOwner ? (
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Manage campaign
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update campaign details and keep donors informed from this page.
                </p>
              </div>
              <button
                onClick={() => setEditing((current) => !current)}
                className="rounded-full border border-border px-4 py-2 text-xs font-medium transition hover:bg-muted"
              >
                {editing ? "Close" : "Edit campaign"}
              </button>
            </div>

            {editing ? (
              <div className="mt-4 grid gap-4">
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
                <FormField label="Campaign title" value={editForm.title} onChange={(value) => setEditForm((current) => ({ ...current, title: value }))} />
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Story</label>
                  <textarea
                    rows={6}
                    value={editForm.story}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, story: event.target.value }))
                    }
                    className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Faith category</label>
                    <select
                      value={editForm.faithCategory}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          faithCategory: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="">Select a category</option>
                      {faithCategoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <FormField label="Location" value={editForm.location} onChange={(value) => setEditForm((current) => ({ ...current, location: value }))} />
                  {campaign.goal !== undefined ? (
                    <FormField
                      label="Goal amount"
                      value={editForm.goalAmount}
                      onChange={(value) =>
                        setEditForm((current) => ({
                          ...current,
                          goalAmount: formatAmountInput(value),
                        }))
                      }
                    />
                  ) : null}
                  {campaign.mode === "one-time" ? (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Urgency</label>
                      <select
                        value={editForm.urgency}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            urgency: event.target.value as typeof current.urgency,
                          }))
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        {urgencyOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </div>

                {campaign.mode === "ongoing" ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium">Giving frequencies</label>
                    <div className="flex flex-wrap gap-2">
                      {frequencyOptions.map((option) => {
                        const selected = editForm.frequencies.includes(option.value);
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              setEditForm((current) => ({
                                ...current,
                                frequencies: selected
                                  ? current.frequencies.filter((item) => item !== option.value)
                                  : [...current.frequencies, option.value],
                              }))
                            }
                            className={`rounded-full px-4 py-2 text-sm font-medium transition ${selected ? "bg-amber-500 text-white" : "border border-border hover:border-amber-300"}`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Cover image</p>
                        <p className="text-xs text-muted-foreground">Replace the primary campaign image.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!ensureMediaReady()) return;
                          coverInputRef.current?.click();
                        }}
                        disabled={uploadCoverMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium transition hover:bg-muted disabled:opacity-60"
                      >
                        {uploadCoverMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                        {uploadCoverMutation.isPending ? "Uploading..." : "Replace"}
                      </button>
                    </div>
                    {editForm.coverImageUrl ? (
                      <img src={editForm.coverImageUrl} alt="" className="mt-3 h-40 w-full rounded-2xl object-cover" />
                    ) : (
                      <p className="mt-3 text-xs text-muted-foreground">No cover image selected.</p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Gallery photos</p>
                        <p className="text-xs text-muted-foreground">Add or remove supporting images.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!ensureMediaReady()) return;
                          galleryInputRef.current?.click();
                        }}
                        disabled={uploadGalleryMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium transition hover:bg-muted disabled:opacity-60"
                      >
                        {uploadGalleryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                        {uploadGalleryMutation.isPending ? "Uploading..." : "Add photos"}
                      </button>
                    </div>
                    {editForm.galleryImageUrls.length > 0 ? (
                      <div className="mt-3 grid grid-cols-3 gap-3">
                        {editForm.galleryImageUrls.map((image) => (
                          <div key={image} className="relative">
                            <img src={image} alt="" className="aspect-square w-full rounded-2xl object-cover" />
                            <button
                              type="button"
                              onClick={() =>
                                setEditForm((current) => ({
                                  ...current,
                                  galleryImageUrls: current.galleryImageUrls.filter((item) => item !== image),
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
                      <p className="mt-3 text-xs text-muted-foreground">No gallery photos added yet.</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => updateCampaignMutation.mutate()}
                    disabled={updateCampaignMutation.isPending}
                    className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
                  >
                    {updateCampaignMutation.isPending ? "Saving..." : "Save campaign"}
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {campaign.gallery.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-xl">Photos</h2>
            <div className="grid grid-cols-3 gap-3">
              {campaign.gallery.map((image) => (
                <div key={image} className="aspect-square overflow-hidden rounded-2xl">
                  <img src={image} alt="" className="h-full w-full object-cover transition duration-300 hover:scale-105" />
                </div>
              ))}
            </div>
          </section>
        )}

        {campaign.updates.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-xl">Updates <span className="text-base font-normal text-muted-foreground">({campaign.updates.length})</span></h2>
            <div className="space-y-4">
              {visibleUpdates.map((update) => (
                <div key={update.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="mb-1 text-xs text-muted-foreground">{update.date}</div>
                  <h3 className="text-sm font-semibold">{update.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{update.body}</p>
                </div>
              ))}
            </div>
            {campaign.updates.length > 1 && (
              <button onClick={() => setShowAllUpdates((value) => !value)} className="mt-3 flex items-center gap-1.5 text-sm text-amber-600 transition hover:text-amber-700">
                {showAllUpdates ? <><ChevronUp className="h-4 w-4" /> Show less</> : <><ChevronDown className="h-4 w-4" /> Show all {campaign.updates.length} updates</>}
              </button>
            )}
          </section>
        )}

        {isOwner ? (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-xl">Post an update</h2>
            <div className="mt-4 space-y-3">
              <FormField label="Update title" value={updateTitle} onChange={setUpdateTitle} />
              <div>
                <label className="mb-1.5 block text-sm font-medium">Update body</label>
                <textarea
                  rows={4}
                  value={updateBody}
                  onChange={(event) => setUpdateBody(event.target.value)}
                  className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => createUpdateMutation.mutate()}
                  disabled={createUpdateMutation.isPending || updateTitle.trim().length < 3 || updateBody.trim().length < 10}
                  className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
                >
                  {createUpdateMutation.isPending ? "Publishing..." : "Publish update"}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {(campaign.comments.length > 0 || viewer) && (
          <section>
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl">
              <MessageSquare className="h-5 w-5 text-amber-500" /> Comments <span className="text-base font-normal text-muted-foreground">({campaign.comments.length})</span>
            </h2>
            {viewer ? (
              <div className="mb-5 rounded-2xl border border-border bg-card p-4">
                <label className="mb-1.5 block text-sm font-medium">Add a comment</label>
                <textarea
                  rows={3}
                  value={commentBody}
                  onChange={(event) => setCommentBody(event.target.value)}
                  className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Share encouragement or ask a thoughtful question."
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => createCommentMutation.mutate()}
                    disabled={createCommentMutation.isPending || commentBody.trim().length < 2}
                    className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
                  >
                    {createCommentMutation.isPending ? "Posting..." : "Post comment"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="mb-4 text-sm text-muted-foreground">
                <Link to="/login" className="text-amber-600 hover:text-amber-700">Log in</Link> to join the conversation.
              </p>
            )}
            <div className="space-y-4">
              {campaign.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                    {(comment.author || "A").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium">{comment.author}</span>
                      <span className="text-muted-foreground">{comment.date}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{comment.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {campaign.donations.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-xl">Recent giving</h2>
            <div className="space-y-3">
              {campaign.donations.slice(0, 5).map((donation) => (
                <div key={donation.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{donation.donor}</span>
                    {donation.note && <span className="text-muted-foreground"> · &quot;{donation.note}&quot;</span>}
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{formatMoney(donation.amount)}</span>
                    <span className="text-xs">{donation.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function FormField({
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
