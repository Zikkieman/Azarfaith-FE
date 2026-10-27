import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Ambulance,
  Check,
  ChevronDown,
  Circle,
  Eye,
  FileText,
  HeartHandshake,
  Home,
  ImagePlus,
  Plus,
  Repeat2,
  Siren,
  Trash2,
  Warehouse,
  X,
} from "lucide-react";
import { toast } from "sonner";
import placeholderCover from "@/assets/placeholder-cover.svg";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { CampaignCard } from "@/components/CampaignCard";
import { Segments } from "@/components/app/Segments";
import { FieldError, Tag, inputClass, labelClass } from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useApp } from "@/lib/store";
import { RequireUser } from "@/components/auth/RequireUser";
import { campaignCategories, formatMoney, type Campaign, type Category } from "@/lib/domain";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { PayoutAccountForm } from "@/components/app/PayoutAccountForm";
import { isNigerianPhone, NigerianPhoneField } from "@/components/app/NigerianPhoneField";

export const Route = createFileRoute("/_app/create")({
  validateSearch: (search: Record<string, unknown>): { draft?: string } => ({
    draft: typeof search.draft === "string" && search.draft ? search.draft : undefined,
  }),
  head: () => ({ meta: [{ title: "New campaign — AzarFaith" }] }),
  component: ProtectedCreateCampaign,
});

function ProtectedCreateCampaign() {
  return <RequireUser><CreateCampaign /></RequireUser>;
}

type Draft = ReturnType<typeof useApp.getState>["draft"];
type CampaignDraftDetail = Campaign & {
  coverImageUrl: string | null;
  contactPhone?: string;
};
type OwnedOrganization = {
  id: string;
  name: string;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
};
type CampaignOwnerProfile = { ownedOrganizations: OwnedOrganization[] };

/** Templates (after Gamma's create-from-template): each sets the basics and a story outline. */
const templates: {
  key: string;
  label: string;
  line: string;
  icon: LucideIcon;
  set: Partial<Draft>;
  outline: string;
}[] = [
  {
    key: "building",
    label: "Building project",
    line: "A roof, a hall, a classroom",
    icon: Warehouse,
    set: { mode: "one-time", type: "money", faithCategory: "Church Building", urgency: "medium" },
    outline:
      "Who we are: [your church or ministry, and how long you've served here]\n\nWhat we're building: [the project, in one sentence]\n\nWhat it costs: [the main items and their prices, e.g. 120 bags of cement at ₦9,500]\n\nWhy now: [what happens if it waits]\n\nHow we'll report back: [photos at each stage, receipts]",
  },
  {
    key: "monthly",
    label: "Monthly support",
    line: "Missionaries, pastors, outreach",
    icon: Repeat2,
    set: {
      mode: "ongoing",
      type: "money",
      faithCategory: "Missions & Outreach",
      frequencies: ["monthly"],
    },
    outline:
      "Who we are: [the ministry and the people you serve]\n\nWhat regular gifts pay for: [salaries, fuel, food, rent, with monthly amounts]\n\nWhat a month looks like: [one real story from last month]\n\nHow we'll keep you posted: [a monthly update with photos]",
  },
  {
    key: "children",
    label: "Children's home",
    line: "Beds, food, school fees",
    icon: Home,
    set: { mode: "one-time", type: "money", faithCategory: "Orphanage", urgency: "high" },
    outline:
      "Who we care for: [how many children, ages, and how they came to you]\n\nWhat they need: [the need, with numbers, e.g. 20 bunk beds at ₦60,000]\n\nWhy it matters now: [what changes for the children]\n\nHow we'll report back: [photos once it's done, receipts]",
  },
  {
    key: "emergency",
    label: "Emergency relief",
    line: "After violence, floods, fire",
    icon: Siren,
    set: { mode: "one-time", type: "emergency", faithCategory: "Emergency", urgency: "critical" },
    outline:
      "What happened: [the event, where and when]\n\nWho is affected: [how many families and where they are now]\n\nWhat we need right now: [food, water, shelter, with costs]\n\nWho is on the ground: [the church or team handing out help]",
  },
  {
    key: "medical",
    label: "Medical outreach",
    line: "Clinics, medicine, surgery",
    icon: Ambulance,
    set: { mode: "one-time", type: "money", faithCategory: "Medical Mission", urgency: "high" },
    outline:
      "Who we serve: [the community and what care they lack]\n\nWhat we'll do: [the outreach, how many days, how many people]\n\nWhat it costs: [medicines, staff, transport, with amounts]\n\nHow we'll report back: [numbers seen and treated, photos]",
  },
  {
    key: "blank",
    label: "Start blank",
    line: "Write it your way",
    icon: FileText,
    set: {},
    outline: "",
  },
];

const types = [
  { v: "money", label: "Money for a goal" },
  { v: "item", label: "Items" },
  { v: "volunteer", label: "Volunteers" },
  { v: "professional", label: "Professional help" },
  { v: "emergency", label: "Emergency relief" },
] as const;

type Requirement = { key: string; label: string; ok: boolean; required: boolean; target: string };

function checksFor(d: Draft, orgVerified: boolean): Requirement[] {
  const story = d.story ?? "";
  const filled = story && !story.includes("[");
  const words = story.trim().split(/\s+/).filter(Boolean).length;
  return [
    {
      key: "kind",
      label: "Choose one-time or ongoing",
      ok: Boolean(d.mode),
      required: true,
      target: "basics",
    },
    {
      key: "title",
      label: "Give it a title",
      ok: (d.title ?? "").trim().length >= 8,
      required: true,
      target: "basics",
    },
    {
      key: "cause",
      label: "Pick a cause and a place",
      ok: Boolean(
        d.faithCategory &&
          d.location?.trim() &&
          (d.faithCategory !== "Other" || d.customFaithCategory?.trim()),
      ),
      required: true,
      target: "basics",
    },
    {
      key: "story",
      label: "Tell the story",
      ok: words >= 100 && words <= 200 && Boolean(filled),
      required: true,
      target: "story",
    },
    d.mode === "ongoing"
      ? {
          key: "freq",
          label: "Choose how often people give",
          ok: Boolean(d.frequencies?.length),
          required: true,
          target: "goal",
        }
      : {
          key: "goal",
          label: "Set a goal",
          ok: Boolean(d.type && d.type !== "money") || (d.goal ?? 0) >= 1000,
          required: true,
          target: "goal",
        },
    {
      key: "cover",
      label: "Add a cover photo",
      ok: Boolean(d.cover),
      required: false,
      target: "photos",
    },
    {
      key: "photos",
      label: "Add 3 or more photos",
      ok: (d.gallery?.length ?? 0) + (d.cover ? 1 : 0) >= 3,
      required: false,
      target: "photos",
    },
    {
      key: "numbers",
      label: "Put numbers in the story",
      ok: /\d/.test(story.replace(/\[[^\]]*\]/g, "")),
      required: false,
      target: "story",
    },
    {
      key: "org",
      label: "Link a verified organization",
      ok: Boolean(d.orgId) && orgVerified,
      required: false,
      target: "org",
    },
  ];
}

/**
 * New campaign as one page (after Rezi's builder and Gamma's templates): templates up top, the
 * form in sections, a strength meter that says what's missing, and a live preview of the page.
 */
function CreateCampaign() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const draft = useApp((s) => s.draft);
  const setDraft = useApp((s) => s.setDraft);
  const resetDraft = useApp((s) => s.resetDraft);
  const addCampaign = useApp((s) => s.addCampaign);
  const ownedOrganizations = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiFetch<CampaignOwnerProfile>("/me/profile"),
  });
  const [template, setTemplate] = useState<string | null>(null);
  const [saved, setSaved] = useState<"saved" | "saving">("saved");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Campaign | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(search.draft ?? null);
  const [contactPhone, setContactPhone] = useState(user?.phone ?? "");
  const [phoneError, setPhoneError] = useState("");
  const [payoutReady, setPayoutReady] = useState(false);
  const hydratedDraftId = useRef<string | null>(null);
  const draftQuery = useQuery({
    queryKey: ["campaign-draft", search.draft],
    queryFn: () => apiFetch<CampaignDraftDetail>(`/campaigns/drafts/${search.draft}`),
    enabled: Boolean(search.draft),
  });
  const [uploading, setUploading] = useState(false);
  const coverInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const first = useRef(true);

  const org = draft.orgId
    ? ownedOrganizations.data?.ownedOrganizations.find((item) => item.id === draft.orgId)
    : undefined;
  const checks = checksFor(draft, org?.verificationStatus === "verified");
  const required = checks.filter((c) => c.required);
  const missing = required.filter((c) => !c.ok);
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  const normalizedPhone = contactPhone.replace(/\s+/g, "").trim();

  useEffect(() => {
    if (user?.phone) setContactPhone((current) => current || user.phone || "");
  }, [user?.phone]);

  useEffect(() => {
    if (search.draft) return;
    resetDraft();
    setDraftId(null);
    hydratedDraftId.current = null;
  }, [search.draft, resetDraft]);

  useEffect(() => {
    if (!search.draft || !draftQuery.data || hydratedDraftId.current === search.draft) return;
    const saved = draftQuery.data;
    resetDraft();
    setDraft({
      mode: saved.mode,
      type: saved.type,
      title: saved.title,
      story: saved.story,
      faithCategory: saved.faithCategory,
      customFaithCategory: saved.customFaithCategory,
      orgId: saved.orgId,
      location: saved.location,
      goal: saved.goal,
      urgency: saved.urgency,
      cover: saved.coverImageUrl ?? undefined,
      gallery: saved.gallery ?? [],
      needs: saved.needs ?? [],
      frequencies: saved.frequencies ?? [],
    });
    setContactPhone(saved.contactPhone || user?.phone || "");
    setDraftId(saved.id);
    hydratedDraftId.current = saved.id;
  }, [search.draft, draftQuery.data, resetDraft, setDraft, user?.phone]);

  // "Saving… Saved" as they type, like any document editor.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaved("saving");
    const t = setTimeout(() => setSaved("saved"), 700);
    return () => clearTimeout(t);
  }, [draft]);

  const pick = (key: string) => {
    const t = templates.find((x) => x.key === key)!;
    const hasStory = (draft.story ?? "").trim().length > 0;
    setTemplate(key);
    setDraft({ ...t.set, story: hasStory ? draft.story : t.outline });
    if (hasStory && t.outline) toast("Template applied. Your story was kept as it is");
  };

  const jump = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const payload = () => ({
    mode: draft.mode?.replace("-", "_").toUpperCase(), type: draft.type?.toUpperCase(),
    title: draft.title?.trim(), story: draft.story?.trim(),
    contactPhone: normalizedPhone || undefined,
    faithCategory: draft.faithCategory?.toUpperCase().replaceAll(" & ", "_").replaceAll(" ", "_"),
    customFaithCategory: draft.faithCategory === "Other" ? draft.customFaithCategory?.trim() : undefined,
    organizationId: draft.orgId || null, location: draft.location?.trim(),
    goalAmount: draft.mode === "one-time" && draft.type === "money" ? draft.goal : null,
    urgency: draft.urgency?.toUpperCase(), coverImageUrl: draft.cover || null,
    galleryImageUrls: draft.gallery?.filter(Boolean), needs: draft.needs?.filter(Boolean),
    frequencies: draft.frequencies?.map((frequency) => frequency.toUpperCase()),
  });

  const saveDraft = async () => {
    const value = payload();
    if (!Object.values(value).some((item) => Array.isArray(item) ? item.length > 0 : Boolean(item))) return;
    setSaved("saving");
    try {
      const savedDraft = await apiFetch<{ id: string }>(draftId ? `/campaigns/${draftId}/draft` : "/campaigns/drafts", { method: draftId ? "PATCH" : "POST", body: JSON.stringify(value) });
      setDraftId(savedDraft.id);
      hydratedDraftId.current = savedDraft.id;
      await queryClient.invalidateQueries({ queryKey: ["campaign-drafts"], refetchType: "all" });
      if (search.draft !== savedDraft.id) {
        void nav({ to: "/create", search: { draft: savedDraft.id }, replace: true });
      }
      setSaved("saved");
      toast.success("Draft saved. Continue it from Manage.");
    } catch (error) {
      setSaved("saved");
      toast.error(error instanceof Error ? error.message : "Could not save your draft.");
    }
  };

  const upload = async (files: FileList | null, target: "cover" | "gallery") => {
    if (!files?.length) return;
    const selected = Array.from(files);
    const available = target === "cover" ? 1 : 8 - (useApp.getState().draft.gallery?.length ?? 0);
    if (selected.length > available) {
      toast.error(target === "cover" ? "Choose one cover photo." : `You can add ${available} more gallery photo${available === 1 ? "" : "s"}.`);
      return;
    }
    if (selected.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      toast.error("Choose JPEG, PNG or WebP images.");
      return;
    }
    if (selected.some((file) => file.size > 5 * 1024 * 1024)) {
      toast.error("Each image must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const results = await Promise.allSettled(selected.map(async (file) => {
        const form = new FormData();
        form.append("file", file);
        form.append("folder", target === "cover" ? "campaign-cover" : "campaign-gallery");
        return apiFetch<{ url: string }>("/media/upload", { method: "POST", body: form });
      }));
      const urls = results.flatMap((result) => result.status === "fulfilled" ? [result.value.url] : []);
      if (urls.length) {
        if (target === "cover") setDraft({ cover: urls[0] });
        else setDraft({ gallery: [...(useApp.getState().draft.gallery ?? []), ...urls].slice(0, 8) });
        if (urls.length > 1) toast.success(`${urls.length} photos uploaded`);
      }
      const failed = results.filter((result) => result.status === "rejected");
      if (failed.length) {
        const reason = failed[0] as PromiseRejectedResult;
        toast.error(failed.length === 1 && selected.length === 1 && reason.reason instanceof Error
          ? reason.reason.message
          : `${failed.length} photo${failed.length === 1 ? "" : "s"} could not be uploaded. Try again.`);
      }
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (missing.length) {
      setShowErrors(true);
      jump(missing[0].target);
      toast.error(`${missing.length} thing${missing.length > 1 ? "s" : ""} to finish first`);
      return;
    }
    if (!isNigerianPhone(normalizedPhone)) {
      setPhoneError("Enter a valid Nigerian phone number");
      jump("org");
      toast.error("Enter your contact phone number before submitting.");
      return;
    }
    if (!payoutReady) {
      jump("payout");
      toast.error("Add and verify the payout account for this campaign before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      if (draftId) {
        await apiFetch(`/campaigns/${draftId}/draft`, { method: "PATCH", body: JSON.stringify(payload()) });
      }
      const campaign = await apiFetch<Campaign>(draftId ? `/campaigns/${draftId}/submit` : "/campaigns", { method: "POST", body: draftId ? undefined : JSON.stringify(payload()) });
      setDone(campaign);
      resetDraft();
      void queryClient.invalidateQueries({ queryKey: ["campaign-drafts"] });
      void queryClient.invalidateQueries({ queryKey: ["my-dashboard"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  if (search.draft && hydratedDraftId.current !== search.draft) {
    if (draftQuery.error) {
      return (
        <div className="mx-auto max-w-xl px-6 py-16 text-center">
          <h1 className="font-display text-2xl text-ink">Could not open this campaign draft</h1>
          <p className="mt-3 text-sm text-danger">{draftQuery.error instanceof Error ? draftQuery.error.message : "Please try again."}</p>
          <button type="button" className={btn("secondary", "sm") + " mt-5"} onClick={() => { void draftQuery.refetch(); }}>Try again</button>
        </div>
      );
    }
    return <p className="p-8 text-sm text-muted-ink">Loading campaign draft…</p>;
  }

  if (done)
    return (
      <Submitted
        campaign={done}
        onView={() => nav({ to: "/campaign/$id", params: { id: done.id } })}
      />
    );

  const err = (key: string) =>
    showErrors ? checks.find((c) => c.key === key && c.required && !c.ok) : undefined;

  return (
    <div className="min-h-screen bg-paper font-gsf text-heading">
      <header className="sticky top-0 z-30 border-b border-line-soft bg-paper/90 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <Link
            to="/dashboard"
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-panel hover:text-ink"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <span className="hidden sm:block">
            <AuthLogo />
          </span>
          <span className="hidden h-5 w-px bg-line-soft sm:block" />
          <p className="hidden min-w-0 truncate text-sm font-medium text-ink sm:block">
            {draft.title?.trim() || "New campaign"}
          </p>
          <Tag>Draft</Tag>
          <span className="hidden text-[13px] text-muted-ink md:inline">
            {saved === "saving" ? "Saving…" : "Saved"}
          </span>
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className={cn(btn("secondary", "sm"), "lg:hidden")}
          >
            <Eye className="h-4 w-4" strokeWidth={1.75} /> Preview
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            title={
              missing.length
                ? `Still to do: ${missing.map((m) => m.label.toLowerCase()).join(", ")}`
                : undefined
            }
            className={btn("primary", "sm")}
          >
            {submitting ? (
              "Submitting…"
            ) : (
              <>
                Submit<span className="hidden sm:inline"> for review</span>
              </>
            )}
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[264px_minmax(0,1fr)_420px]">
        <aside className="hidden border-r border-line-soft bg-panel/40 lg:block">
          <div className="sticky top-14 flex max-h-[calc(100vh-56px)] flex-col gap-5 overflow-y-auto p-5">
            <Strength score={score} missing={missing.length} />
            {[
              { title: "Required", items: required },
              { title: "Recommended", items: checks.filter((c) => !c.required) },
            ].map((g) => (
              <div key={g.title} className="flex flex-col gap-1">
                <p className="px-2 text-[12px] font-medium text-subtle">
                  {g.title}{" "}
                  <span className="font-normal">
                    {g.items.filter((c) => c.ok).length}/{g.items.length}
                  </span>
                </p>
                <ul className="flex flex-col gap-0.5">
                  {g.items.map((c) => (
                    <li key={c.key}>
                      <CheckItem check={c} onClick={() => jump(c.target)} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        <main className="min-w-0 px-5 pb-24 pt-8 sm:px-10">
          <div className="mx-auto flex max-w-[640px] flex-col gap-12">
            <details className="group rounded-field border border-line-soft lg:hidden">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm">
                <span className="font-medium text-ink">{score}%</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-soft">
                  <span
                    className={cn(
                      "block h-full rounded-full transition-[width] duration-500",
                      missing.length ? "bg-brand" : "bg-verified",
                    )}
                    style={{ width: `${score}%` }}
                  />
                </span>
                <span className="text-muted-ink">
                  {missing.length ? `${missing.length} required left` : "Ready"}
                </span>
                <ChevronDown
                  className="h-4 w-4 text-muted-ink transition-transform group-open:rotate-180"
                  strokeWidth={2}
                />
              </summary>
              <ul className="flex flex-col gap-0.5 border-t border-line-soft p-2">
                {checks.map((c) => (
                  <li key={c.key}>
                    <CheckItem check={c} onClick={() => jump(c.target)} />
                  </li>
                ))}
              </ul>
            </details>

            <Section
              id="template"
              title="Start from a template"
              note="It fills in the basics and an outline for your story. You can change anything."
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {templates.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    aria-pressed={template === t.key}
                    onClick={() => pick(t.key)}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-field border p-3.5 text-left transition-[border-color,box-shadow]",
                      template === t.key
                        ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]"
                        : "border-line-soft hover:border-line-input",
                    )}
                  >
                    <t.icon className="h-5 w-5 text-ink-soft" strokeWidth={1.5} />
                    <span>
                      <span className="block text-sm font-medium text-ink">{t.label}</span>
                      <span className="block text-[12px] text-muted-ink">{t.line}</span>
                    </span>
                  </button>
                ))}
              </div>
            </Section>

            <Section id="basics" title="Basics">
              <div className="flex flex-col gap-1.5">
                <span className={labelClass}>Kind of campaign</span>
                <div
                  className="grid grid-cols-2 gap-0.5 rounded-[12px] bg-panel p-1"
                  role="radiogroup"
                >
                  {(
                    [
                      { v: "one-time", label: "One-time", note: "A goal for one need" },
                      { v: "ongoing", label: "Ongoing", note: "Regular monthly or weekly gifts" },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      role="radio"
                      aria-checked={draft.mode === o.v}
                      onClick={() => setDraft({ mode: o.v })}
                      className={cn(
                        "flex flex-col items-start rounded-[9px] px-3 py-2 text-left transition-all",
                        draft.mode === o.v
                          ? "bg-paper shadow-[0_1px_2px_rgba(19,14,48,0.12)] ring-1 ring-line-soft"
                          : "hover:bg-paper/50",
                      )}
                    >
                      <span className="text-sm font-medium text-ink">{o.label}</span>
                      <span className="text-[12px] text-muted-ink">{o.note}</span>
                    </button>
                  ))}
                </div>
                {err("kind") ? <FieldError>Choose one-time or ongoing.</FieldError> : null}
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="flex items-baseline justify-between">
                  <span className={labelClass}>Title</span>
                  <span
                    className={cn(
                      "text-[12px]",
                      (draft.title?.length ?? 0) > 70 ? "text-danger" : "text-subtle",
                    )}
                  >
                    {draft.title?.length ?? 0}/70
                  </span>
                </span>
                <input
                  value={draft.title ?? ""}
                  maxLength={80}
                  onChange={(e) => setDraft({ title: e.target.value })}
                  placeholder="e.g. 20 bunk beds for new children at Grace Harvest, Jos"
                  className={cn(inputClass, err("title") && "border-danger")}
                />
                <span className="text-[12px] text-muted-ink">
                  Say what it is and where. Givers decide from the title.
                </span>
                {err("title") ? (
                  <FieldError>The title needs at least 8 characters.</FieldError>
                ) : null}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Asking for"
                  value={draft.type ?? ""}
                  onChange={(v) =>
                    setDraft({ type: (v || undefined) as Campaign["type"] | undefined })
                  }
                  options={types.map((t) => ({ value: t.v, label: t.label }))}
                  placeholder="Choose"
                />
                <SelectField
                  label="Cause"
                  value={draft.faithCategory ?? ""}
                  onChange={(v) =>
                    setDraft({
                      faithCategory: (v || undefined) as Category | undefined,
                      ...(v === "Other" ? {} : { customFaithCategory: undefined }),
                    })
                  }
                  options={campaignCategories.map((label) => ({ value: label, label }))}
                  placeholder="Choose"
                  error={err("cause") && !draft.faithCategory}
                />
                {draft.faithCategory === "Other" ? (
                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>Specify your cause</span>
                    <input
                      value={draft.customFaithCategory ?? ""}
                      maxLength={80}
                      onChange={(event) => setDraft({ customFaithCategory: event.target.value })}
                      placeholder="e.g. Prison ministry"
                      className={cn(
                        inputClass,
                        err("cause") && !draft.customFaithCategory?.trim() && "border-danger",
                      )}
                    />
                    {err("cause") && !draft.customFaithCategory?.trim() ? (
                      <FieldError>Describe the cause for this campaign.</FieldError>
                    ) : null}
                  </label>
                ) : null}
              </div>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Town and state</span>
                <input
                  value={draft.location ?? ""}
                  onChange={(e) => setDraft({ location: e.target.value })}
                  placeholder="e.g. Jos, Plateau State"
                  className={cn(
                    inputClass,
                    err("cause") && !draft.location?.trim() && "border-danger",
                  )}
                />
                {err("cause") ? (
                  <FieldError>Pick a cause and add where the work happens.</FieldError>
                ) : null}
              </label>
            </Section>

            <Section
              id="story"
              title="Story"
              note="The single biggest reason people give. Be specific."
            >
              <textarea
                rows={12}
                value={draft.story ?? ""}
                onChange={(e) => setDraft({ story: e.target.value })}
                placeholder="Who you serve, what you need and what it costs, why now, and how you'll report back."
                className={cn(
                  inputClass,
                  "resize-y leading-[1.65]",
                  err("story") && "border-danger",
                )}
              />
              <div className="flex items-start justify-between gap-4">
                <span className="text-[12px] text-muted-ink">
                  {(draft.story ?? "").includes("[")
                    ? "Replace the [bracketed] parts with your own words."
                    : ""}
                </span>
                <span className="shrink-0 text-[12px] text-subtle">{(draft.story ?? "").trim().split(/\s+/).filter(Boolean).length} / 100–200 words</span>
              </div>
              {err("story") ? (
                <FieldError>
                  Write 100–200 words and fill in every bracketed part.
                </FieldError>
              ) : null}
            </Section>

            <Section
              id="photos"
              title="Photos"
              note="Real photos of the people and the place. No stock images."
            >
              <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { void upload(event.target.files, "cover"); event.target.value = ""; }} />
              <input ref={galleryInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => { void upload(event.target.files, "gallery"); event.target.value = ""; }} />
              <PhotoTile
                label="Cover photo"
                src={draft.cover}
                tall
                onAdd={() => coverInput.current?.click()}
                disabled={uploading}
                onRemove={() => setDraft({ cover: undefined })}
              />
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {(draft.gallery ?? []).map((p, i) => (
                  <PhotoTile
                    key={p}
                    src={p}
                    label={`Photo ${i + 1}`}
                    disabled={uploading}
                    onRemove={() =>
                      setDraft({ gallery: (draft.gallery ?? []).filter((x) => x !== p) })
                    }
                  />
                ))}
                {(draft.gallery?.length ?? 0) < 8 ? (
                  <PhotoTile
                    label="Add"
                    onAdd={() => galleryInput.current?.click()}
                    disabled={uploading}
                  />
                ) : null}
              </div>
              <p className="text-[12px] text-subtle" aria-live="polite">{uploading ? "Uploading photos…" : (draft.gallery?.length ?? 0) >= 8 ? "Gallery full (8 photos). Remove one to add another." : `Select up to ${8 - (draft.gallery?.length ?? 0)} gallery photos at once. JPEG, PNG or WebP. Up to 5 MB each.`}</p>
            </Section>

            <Section
              id="goal"
              title={draft.mode === "ongoing" ? "Regular giving" : "Goal"}
              note={
                draft.mode === "ongoing"
                  ? "Givers choose from the options you allow."
                  : "What the whole thing costs. Givers see how close you are."
              }
            >
              {draft.mode === "ongoing" ? (
                <div className="flex flex-wrap gap-2">
                  {(["weekly", "monthly", "quarterly"] as const).map((f) => {
                    const on = draft.frequencies?.includes(f) ?? false;
                    return (
                      <button
                        key={f}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setDraft({
                            frequencies: on
                              ? (draft.frequencies ?? []).filter((x) => x !== f)
                              : [...(draft.frequencies ?? []), f],
                          })
                        }
                        className={cn(
                          "inline-flex h-10 items-center gap-2 rounded-field border px-4 text-sm font-medium capitalize transition-colors",
                          on
                            ? "border-ink bg-ink text-ink-contrast"
                            : "border-line-input hover:border-ink",
                        )}
                      >
                        {on ? (
                          <Check className="h-4 w-4" strokeWidth={2.5} />
                        ) : (
                          <Plus className="h-4 w-4" strokeWidth={2} />
                        )}
                        {f}
                      </button>
                    );
                  })}
                  {err("freq") ? <FieldError>Choose at least one.</FieldError> : null}
                </div>
              ) : (
                <>
                  {draft.type === "money" || !draft.type ? (
                    <label className="flex max-w-[320px] flex-col gap-1.5">
                      <span className={labelClass}>Amount needed</span>
                      <span className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-ink">
                          ₦
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={draft.goal ? draft.goal.toLocaleString("en-NG") : ""}
                          onChange={(event) => {
                            const digits = event.target.value.replace(/\D/g, "");
                            setDraft({ goal: digits ? Number(digits) : undefined });
                          }}
                          placeholder="1,200,000"
                          className={cn(inputClass, "pl-8", err("goal") && "border-danger")}
                        />
                      </span>
                      {err("goal") ? <FieldError>Set a goal of at least ₦1,000.</FieldError> : null}
                    </label>
                  ) : (
                    <p className="text-sm text-ink-soft">
                      No money goal for this kind of campaign.
                    </p>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <span className={labelClass}>How urgent is it?</span>
                    <div className="grid grid-cols-2 gap-0.5 rounded-[12px] bg-panel p-1 sm:grid-cols-4">
                      {(["low", "medium", "high", "critical"] as const).map((u) => (
                        <button
                          key={u}
                          type="button"
                          aria-pressed={(draft.urgency ?? "medium") === u}
                          onClick={() => setDraft({ urgency: u })}
                          className={cn(
                            "h-9 rounded-[9px] text-[13px] font-medium capitalize transition-all",
                            (draft.urgency ?? "medium") === u
                              ? "bg-paper text-ink shadow-[0_1px_2px_rgba(19,14,48,0.12)] ring-1 ring-line-soft"
                              : "text-muted-ink hover:text-ink",
                          )}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                    <span className="text-[12px] text-muted-ink">
                      Critical campaigns are shown first in Discover. Use it only for real
                      emergencies.
                    </span>
                  </div>
                </>
              )}
            </Section>

            <Section
              id="org"
              title="Organization"
              note="Campaigns from a verified organization get the green tick and are reviewed faster."
            >
              <SelectField
                label="Raising for"
                value={draft.orgId ?? ""}
                onChange={(v) => setDraft({ orgId: v || undefined })}
                options={(ownedOrganizations.data?.ownedOrganizations ?? []).map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
                placeholder="Myself (a personal campaign)"
              />
              {ownedOrganizations.error ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-field bg-danger/5 p-3">
                  <FieldError>Could not load the organizations you own.</FieldError>
                  <button
                    type="button"
                    className={btn("secondary", "sm")}
                    onClick={() => void ownedOrganizations.refetch()}
                  >
                    Try again
                  </button>
                </div>
              ) : null}
              <NigerianPhoneField
                id="campaign-contact-phone"
                label="Your contact phone number"
                required
                value={contactPhone}
                error={phoneError}
                description="We’ll use this number to contact you about this campaign."
                onChange={(value) => {
                  setContactPhone(value);
                  setPhoneError("");
                }}
              />
              {org && org.verificationStatus !== "verified" ? (
                <p className="rounded-field bg-panel px-4 py-3 text-[13px] text-ink-soft">
                  {org.name} isn't verified yet. You can submit now; the campaign goes live once
                  they are.
                </p>
              ) : null}
            </Section>

            <Section
              id="payout"
              title="Payout account"
              note={draft.orgId
                ? `Where gifts raised for ${org?.name || "this organization"} will be paid.`
                : "Where gifts raised by this campaign will be paid."}
            >
              <PayoutAccountForm
                organizationId={draft.orgId}
                organizationName={org?.name}
                onReadyChange={setPayoutReady}
              />
            </Section>

            <div className="flex flex-col-reverse gap-3 border-t border-line-soft pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => { void saveDraft(); }}
                className={btn("secondary")}
              >
                Save draft
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className={btn("primary")}
              >
                {submitting ? "Submitting…" : "Submit for review"}
              </button>
            </div>
          </div>
        </main>

        <aside className="hidden border-l border-line-soft bg-panel/40 lg:block">
          <div className="sticky top-14 max-h-[calc(100vh-56px)] overflow-y-auto p-6">
            <Preview draft={draft} orgName={org?.name} raiser={user ? { name: user.fullName, avatar: user.avatarUrl ?? "" } : undefined} />
          </div>
        </aside>
      </div>

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-card p-5">
          <SheetTitle className="sr-only">Preview</SheetTitle>
          <Preview draft={draft} orgName={org?.name} raiser={user ? { name: user.fullName, avatar: user.avatarUrl ?? "" } : undefined} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Section({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-4">
      <div>
        <h2 className="font-display text-[22px] leading-tight tracking-[-0.02em] text-ink">
          {title}
        </h2>
        {note ? <p className="mt-1 text-sm text-muted-ink">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  error?: unknown;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            inputClass,
            "cursor-pointer appearance-none pr-10",
            !value && "text-subtle",
            error ? "border-danger" : "",
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink"
          strokeWidth={2}
        />
      </span>
    </label>
  );
}

function PhotoTile({
  label,
  src,
  tall,
  onAdd,
  onRemove,
  disabled = false,
}: {
  label: string;
  src?: string;
  tall?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  if (src) {
    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-field bg-panel",
          tall ? "aspect-[16/9]" : "aspect-square",
        )}
      >
        <img src={src} alt={label} className="h-full w-full object-cover" />
        <span className="absolute left-2 top-2 rounded-[6px] bg-paper/90 px-1.5 py-0.5 text-[11px] font-medium text-ink">
          {label}
        </span>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label={`Remove ${label.toLowerCase()}`}
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-paper/90 text-ink opacity-0 transition-opacity hover:bg-paper focus:opacity-100 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 rounded-field border border-dashed border-line-input bg-panel/50 text-[13px] text-muted-ink transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-50",
        tall ? "aspect-[16/9]" : "aspect-square",
      )}
    >
      <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
      {label}
    </button>
  );
}

function CheckItem({ check: c, onClick }: { check: Requirement; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-2.5 rounded-[8px] px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-paper"
    >
      {c.ok ? (
        <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-verified text-white">
          <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
        </span>
      ) : c.required ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2} />
      ) : (
        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-line-input" strokeWidth={2} />
      )}
      <span className={c.ok ? "text-muted-ink" : "text-ink"}>{c.label}</span>
    </button>
  );
}

/** Rezi-style score ring: how ready the campaign is, and how many required things are left. */
function Strength({ score, missing }: { score: number; missing: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const label = missing
    ? `${missing} required left`
    : score >= 85
      ? "Strong and ready"
      : "Ready to submit";
  return (
    <div className="flex items-center gap-3">
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--color-line-soft)" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={missing ? "var(--color-brand)" : "var(--color-verified)"}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          className="transition-[stroke-dashoffset] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
        />
      </svg>
      <div>
        <p className="font-display text-[22px] leading-none text-ink">{score}%</p>
        <p className="mt-1 text-[13px] text-muted-ink">{label}</p>
      </div>
    </div>
  );
}

function previewOf(d: Draft): Campaign {
  return {
    id: "preview",
    mode: d.mode ?? "one-time",
    type: d.type ?? "money",
    title: d.title?.trim() || "Your campaign title",
    story: d.story ?? "",
    faithCategory: d.faithCategory ?? campaignCategories[0],
    orgId: d.orgId,
    raiser: { name: "You", avatar: "", location: d.location ?? "", trustScore: 0 },
    cover: d.cover ?? placeholderCover,
    gallery: d.gallery ?? [],
    goal: d.mode !== "ongoing" && d.goal ? d.goal : undefined,
    raised: 0,
    donors: 0,
    currency: "NGN",
    location: d.location ?? "",
    urgency: d.urgency ?? "medium",
    createdAt: "",
    verificationStatus: "pending",
    updates: [],
    comments: [],
    donations: [],
    frequencies:
      d.mode === "ongoing" ? (d.frequencies?.length ? d.frequencies : ["monthly"]) : undefined,
  };
}

/** Live preview with two views: the card in Discover, and the top of the campaign page. */
function Preview({ draft, orgName, raiser }: { draft: Draft; orgName?: string; raiser?: { name: string; avatar: string } }) {
  const [view, setView] = useState<"page" | "card">("page");
  const c = useMemo(() => previewOf(draft), [draft]);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-subtle">How givers will see it</p>
        <div className="inline-flex rounded-[9px] bg-paper p-0.5 ring-1 ring-line-soft">
          {(["page", "card"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                "h-7 rounded-[7px] px-2.5 text-[12px] font-medium capitalize transition-colors",
                view === v ? "bg-ink text-ink-contrast" : "text-muted-ink hover:text-ink",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <div inert className="pointer-events-none">
        {view === "card" ? (
          <CampaignCard campaign={c} />
        ) : (
          <div className="overflow-hidden rounded-card border border-line-soft bg-paper">
            <img src={c.cover} alt="" className="aspect-[16/10] w-full object-cover" />
            <div className="flex flex-col gap-3 p-4">
              <p className="flex items-center gap-1.5 text-[12px] text-muted-ink">
                {raiser?.avatar ? <img src={raiser.avatar} alt="" className="h-4 w-4 rounded-full object-cover" /> : null}
                {raiser?.name ?? "You"}
                {orgName ? ` for ${orgName}` : ""}
              </p>
              <p className="font-display text-[19px] leading-[1.2] text-ink">{c.title}</p>
              {c.goal ? (
                <div className="flex flex-col gap-1.5">
                  <Segments pct={0} />
                  <p className="text-[12px] text-muted-ink">₦0 raised of {formatMoney(c.goal)}</p>
                </div>
              ) : c.mode === "ongoing" ? (
                <p className="flex items-center gap-1.5 text-[12px] text-muted-ink">
                  <HeartHandshake className="h-3.5 w-3.5" strokeWidth={1.75} /> Regular giving:{" "}
                  {(c.frequencies ?? []).join(", ")}
                </p>
              ) : null}
              <p className="line-clamp-6 whitespace-pre-wrap text-[13px] leading-[1.6] text-ink-soft">
                {c.story || "Your story appears here."}
              </p>
              {c.gallery.length ? (
                <div className="grid grid-cols-4 gap-1.5">
                  {c.gallery.slice(0, 4).map((p) => (
                    <img
                      key={p}
                      src={p}
                      alt=""
                      className="aspect-square w-full rounded-[6px] object-cover"
                    />
                  ))}
                </div>
              ) : null}
              <span className={cn(btn("primary", "sm"), "w-full")}>Give now</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Submitted({ campaign, onView }: { campaign: Campaign; onView: () => void }) {
  const steps = [
    { label: "Submitted", note: "Just now", done: true },
    { label: "We review it", note: "Usually within 1 working day", done: false },
    { label: "It goes live", note: "We email you the moment it does", done: false },
    { label: "Share it", note: "Your congregation first", done: false },
  ];
  return (
    <div className="min-h-screen bg-panel px-6 py-10 font-gsf">
      <div className="mx-auto flex max-w-[520px] flex-col items-center gap-6">
        <Link to="/" aria-label="AzarFaith home">
          <AuthLogo />
        </Link>
        <div className="admin-rise w-full rounded-card bg-paper p-6 shadow-[0_24px_64px_-24px_rgba(19,14,48,0.25)] sm:p-8">
          <h1 className="font-display text-[28px] leading-tight text-ink">Submitted for review</h1>
          <p className="mt-2 text-[15px] text-ink-soft">“{campaign.title}” is with our team.</p>
          <ol className="mt-6 flex flex-col">
            {steps.map((s, i) => (
              <li key={s.label} className="relative flex gap-3 pb-5 last:pb-0">
                {i < steps.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute left-[9px] top-6 h-full w-px bg-line-soft"
                  />
                ) : null}
                <span
                  className={cn(
                    "relative grid h-5 w-5 shrink-0 place-items-center rounded-full",
                    s.done
                      ? "bg-verified text-white"
                      : "border border-dashed border-line-input bg-paper",
                  )}
                >
                  {s.done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                </span>
                <span>
                  <span className="block text-sm font-medium text-ink">{s.label}</span>
                  <span className="block text-[13px] text-muted-ink">{s.note}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onView} className={btn("primary")}>
            View campaign
          </button>
          <Link to="/dashboard" className={btn("secondary")}>
            Back to Manage
          </Link>
        </div>
      </div>
    </div>
  );
}
