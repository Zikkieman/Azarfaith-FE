import { useRef, useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { UserAvatar } from "@/components/UserAvatar";
import { PageSpinner } from "@/components/PageSpinner";
import { LoadError } from "@/components/profile/SettingsParts";
import { CampaignCard } from "@/components/app/CampaignCard";
import { Segments } from "@/components/app/Segments";
import { FieldError, Tag, inputClass, labelClass } from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import { Sheet, SheetContent, SheetTitle } from "@/components/app/DesignSheet";
import { CampaignUploads } from "@/components/creation/DesignMedia";
import { CampaignPayoutAccount } from "@/components/creation/CampaignPayoutAccount";
import { useCreationSession } from "@/components/creation/useCreationSession";
import { useAppSelector } from "@/app/hooks";
import {
  getCampaignDraft,
  getProfile,
  getPersonalPayoutAccount,
  getOrganizationPayoutAccount,
  saveCampaignDraft,
  submitCampaignDraft,
  updateCampaignDraft,
} from "@/features/catalog/api";
import { faithCategoryOptions, formatMoney, type Campaign } from "@/lib/catalog";
import {
  campaignErrors,
  campaignForm,
  campaignPayload,
  campaignPayoutError,
  countWords,
  hasCampaignDraftContent,
  type CampaignForm,
} from "@/lib/creation";
import { formatCheckoutInput } from "@/lib/checkout";
import { isPublished } from "@/lib/discovery";
import { cn } from "@/lib/utils";
export const Route = createFileRoute("/create")({
  validateSearch: (s: Record<string, unknown>): { draftId?: string } => ({
    draftId: typeof s.draftId === "string" ? s.draftId : undefined,
  }),
  component: CreateCampaign,
});

type Draft = {
  mode?: Campaign["mode"];
  type?: Campaign["type"];
  title?: string;
  story?: string;
  faithCategory?: string;
  orgId?: string;
  location?: string;
  goal?: string | number;
  urgency?: Campaign["urgency"];
  cover?: string;
  gallery?: string[];
  frequencies?: Campaign["frequencies"];
};
type Category = string;
type Requirement = { key: string; label: string; ok: boolean; required: boolean; target: string };
const categories = faithCategoryOptions;
function targetFor(key: string) {
  return (
    (
      {
        mode: "basics",
        type: "basics",
        title: "basics",
        faithCategory: "basics",
        location: "basics",
        story: "story",
        goalAmount: "goal",
        frequencies: "goal",
        coverImageUrl: "photos",
        galleryImageUrls: "photos",
        needs: "needs",
        organizationId: "org",
        profile: "org",
        payoutAccount: "field-payoutAccount",
      } as Record<string, string>
    )[key] ?? "basics"
  );
}
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

function CreateCampaign() {
  const { draftId } = Route.useSearch();
  const { ready, userId } = useCreationSession();
  const query = useQuery({
    queryKey: ["campaign-draft", userId, draftId],
    queryFn: () => getCampaignDraft(draftId!),
    enabled: ready && Boolean(draftId),
  });
  useCreationSession(query.error);
  if (!ready || (draftId && query.isPending)) return <PageSpinner label="Loading campaign draft" />;
  if (draftId && !query.data)
    return (
      <div className="mx-auto max-w-xl p-8">
        <LoadError
          message="Could not load this campaign draft. Nothing has been overwritten."
          retry={() => void query.refetch()}
        />
      </div>
    );
  return (
    <CampaignEditor
      key={`${userId}:${draftId ?? "new"}`}
      draft={draftId ? query.data : undefined}
      userId={userId!}
    />
  );
}
function CampaignEditor({ draft, userId }: { draft?: Campaign; userId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => campaignForm(draft));
  const [savedId, setSavedId] = useState(draft?.id);
  const [showErrors, setShowErrors] = useState(false);
  const [uploads, setUploads] = useState(0);
  const onBusy = (uploading: boolean) => setUploads((n) => Math.max(0, n + (uploading ? 1 : -1)));
  const [template, setTemplate] = useState<string | null>(null);
  const [done, setDone] = useState<Campaign | null>(null);
  const savingLock = useRef(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [need, setNeed] = useState("");
  const [needError, setNeedError] = useState("");
  const [dirty, setDirty] = useState(false);
  const profile = useQuery({ queryKey: ["profile", userId], queryFn: getProfile });
  useCreationSession(profile.error);
  const eligibleOrganization =
    !form.organizationId ||
    Boolean(
      profile.data?.ownedOrganizations.some(
        (org) => org.id === form.organizationId && org.reviewAction !== "rejected",
      ),
    );
  const payout = useQuery({
    queryKey: ["campaign-payout-account", userId, form.organizationId || "personal"],
    queryFn: () =>
      form.organizationId
        ? getOrganizationPayoutAccount(form.organizationId)
        : getPersonalPayoutAccount(),
    enabled: eligibleOrganization,
  });
  useCreationSession(payout.error);
  const payoutError = !eligibleOrganization
    ? "Choose an eligible organization before checking its payout account."
    : campaignPayoutError({
        account: payout.data,
        loading: payout.isPending,
        failed: payout.isError,
      });
  const change = (patch: Partial<CampaignForm>) => {
    setForm((current) => ({ ...current, ...patch }));
    setDirty(true);
  };
  const allErrors = campaignErrors(form);
  const hasTemplateInstructions = templates.some((t) =>
    (t.outline.match(/\[[^\]]*\]/g) ?? []).some((instruction) => form.story.includes(instruction)),
  );
  if (hasTemplateInstructions)
    allErrors.story =
      "Replace the bracketed template instructions with your own story, using 100 to 200 words.";
  if (
    form.organizationId &&
    profile.data &&
    !profile.data.ownedOrganizations.some(
      (org) => org.id === form.organizationId && org.reviewAction !== "rejected",
    )
  )
    allErrors.organizationId =
      "Select one of your eligible organizations, or create a standalone campaign.";
  if (payoutError) allErrors.payoutAccount = payoutError;
  const errors = showErrors ? allErrors : {};
  const mutation = useMutation({
    mutationFn: async ({ submit, exit }: { submit: boolean; exit: boolean }) => {
      const payload = campaignPayload(form);
      const saved = savedId
        ? await updateCampaignDraft(savedId, payload)
        : await saveCampaignDraft(payload);
      setSavedId(saved.id);
      queryClient.setQueryData(["campaign-draft", userId, saved.id], saved);
      const result = submit ? await submitCampaignDraft(saved.id) : saved;
      return { result, submit, exit };
    },
    onSuccess: async ({ result, submit, exit }) => {
      setDirty(false);
      for (const key of ["campaign-drafts", "profile", "campaigns", "organizations", "dashboard"])
        void queryClient.invalidateQueries({ queryKey: [key] });
      toast.success(
        submit
          ? "Campaign submitted. Its review status is shown on the preview page."
          : "Campaign draft saved.",
      );
      savingLock.current = false;
      if (submit) setDone(result);
      else if (exit) await navigate({ to: "/dashboard" });
      else if (!draft)
        await navigate({ to: "/create", search: { draftId: result.id }, replace: true });
    },
    onError: () => {
      savingLock.current = false;
    },
  });
  useCreationSession(mutation.error);
  const busy = mutation.isPending || uploads > 0;
  const submit = () => {
    if (busy || savingLock.current) return;
    if (need.trim()) {
      setNeedError("Add this need or clear the field before submitting.");
      jump("needs");
      return;
    }
    setShowErrors(true);
    const missing = Object.keys(allErrors);
    if (missing.length) {
      jump(targetFor(missing[0]));
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus({ preventScroll: true });
      return;
    }
    savingLock.current = true;
    mutation.mutate({ submit: true, exit: false });
  };

  const draftState: Draft = {
    mode: form.mode ? (form.mode === "ONGOING" ? "ongoing" : "one-time") : undefined,
    type: form.type ? (form.type.toLowerCase() as Campaign["type"]) : undefined,
    title: form.title,
    story: form.story,
    faithCategory: faithCategoryOptions.find((c) => c.value === form.faithCategory)?.label,
    location: form.location,
    orgId: form.organizationId || undefined,
    goal: form.goalAmount,
    urgency: form.urgency?.toLowerCase() as Campaign["urgency"],
    cover: form.coverImageUrl || undefined,
    gallery: form.galleryImageUrls,
    frequencies: form.frequencies.map((f) => f.toLowerCase()) as Campaign["frequencies"],
  };
  const setDraft = (patch: Partial<Draft>) =>
    change({
      ...("mode" in patch
        ? { mode: patch.mode ? (patch.mode === "ongoing" ? "ONGOING" : "ONE_TIME") : "" }
        : {}),
      ...("type" in patch ? { type: patch.type?.toUpperCase() as CampaignForm["type"] } : {}),
      ...("title" in patch ? { title: patch.title ?? "" } : {}),
      ...("story" in patch ? { story: patch.story ?? "" } : {}),
      ...("faithCategory" in patch
        ? {
            faithCategory:
              faithCategoryOptions.find((c) => c.label === patch.faithCategory)?.value ?? "",
          }
        : {}),
      ...("orgId" in patch ? { organizationId: patch.orgId ?? "" } : {}),
      ...("location" in patch ? { location: patch.location ?? "" } : {}),
      ...("goal" in patch ? { goalAmount: String(patch.goal ?? "") } : {}),
      ...("urgency" in patch
        ? { urgency: patch.urgency?.toUpperCase() as CampaignForm["urgency"] }
        : {}),
      ...("frequencies" in patch
        ? {
            frequencies: patch.frequencies?.map((f) =>
              f.toUpperCase(),
            ) as CampaignForm["frequencies"],
          }
        : {}),
      ...("cover" in patch ? { coverImageUrl: patch.cover ?? "" } : {}),
      ...("gallery" in patch ? { galleryImageUrls: patch.gallery ?? [] } : {}),
    });
  const orgs = profile.data?.ownedOrganizations.filter((o) => o.reviewAction !== "rejected") ?? [];
  const org = orgs.find((o) => o.id === form.organizationId);
  if (profile.isPending || profile.isError)
    allErrors.profile = "Load your organizations before submitting.";
  const checks: Requirement[] = [
    {
      key: "kind",
      label: "Choose one-time or ongoing",
      ok: !allErrors.mode && !allErrors.type,
      required: true,
      target: "basics",
    },
    {
      key: "title",
      label: "Give it a title",
      ok: !allErrors.title,
      required: true,
      target: "basics",
    },
    {
      key: "cause",
      label: "Pick a cause and a place",
      ok: !allErrors.faithCategory && !allErrors.location,
      required: true,
      target: "basics",
    },
    {
      key: "story",
      label: "Tell the story",
      ok: !allErrors.story,
      required: true,
      target: "story",
    },
    form.mode === "ONGOING"
      ? {
          key: "freq",
          label: "Choose how often people give",
          ok: !allErrors.frequencies,
          required: true,
          target: "goal",
        }
      : {
          key: "goal",
          label: "Set a goal",
          ok: !allErrors.goalAmount,
          required: form.type === "MONEY" || Boolean(form.goalAmount),
          target: "goal",
        },
    {
      key: "cover",
      label: "Add a cover photo",
      ok: !allErrors.coverImageUrl,
      required: true,
      target: "photos",
    },
    {
      key: "gallery",
      label: "Add at least one gallery photo",
      ok: !allErrors.galleryImageUrls,
      required: true,
      target: "photos",
    },
    {
      key: "payout",
      label: "Reuse your verified payout account",
      ok: !allErrors.payoutAccount,
      required: true,
      target: "field-payoutAccount",
    },
    {
      key: "profile",
      label: "Choose an eligible organizer",
      ok: !allErrors.profile && !allErrors.organizationId,
      required: true,
      target: "org",
    },
    ...(["ITEM", "VOLUNTEER", "PROFESSIONAL"].includes(form.type)
      ? [
          {
            key: "needs",
            label: "List the help you need",
            ok: !allErrors.needs,
            required: true,
            target: "needs",
          },
        ]
      : []),
    {
      key: "photos",
      label: "Add 3 or more photos",
      ok: form.galleryImageUrls.length + (form.coverImageUrl ? 1 : 0) >= 3,
      required: false,
      target: "photos",
    },
    {
      key: "numbers",
      label: "Put numbers in the story",
      ok: /\d/.test(form.story.replace(/\[[^\]]*\]/g, "")),
      required: false,
      target: "story",
    },
    {
      key: "org",
      label: "Link a verified organization",
      ok: org?.verificationStatus === "verified",
      required: false,
      target: "org",
    },
  ];
  const required = checks.filter((c) => c.required),
    missing = required.filter((c) => !c.ok),
    score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  const err = (key: string) =>
    showErrors ? checks.find((c) => c.key === key && c.required && !c.ok) : undefined;
  const pick = (key: string) => {
    const t = templates.find((t) => t.key === key);
    if (!t) return;
    setTemplate(key);
    const hasStory = form.story.trim().length > 0;
    setDraft({ ...t.set, story: hasStory ? form.story : t.outline });
    if (hasStory && t.outline) toast("Template applied. Your story was kept as it is");
  };
  const jump = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const saveDraft = (exit: boolean) => {
    if (busy || savingLock.current) return;
    if (!hasCampaignDraftContent(form)) {
      toast.info("Add at least one detail before saving a campaign draft.");
      if (exit) void navigate({ to: "/dashboard" });
      return;
    }
    if (need.trim()) {
      setNeedError("Add this need or clear the field before saving.");
      jump("needs");
      return;
    }
    const goalText = form.goalAmount.replaceAll(",", "").trim();
    if (
      form.mode === "ONE_TIME" &&
      ["MONEY", "EMERGENCY"].includes(form.type) &&
      goalText &&
      (!/^\d+$/.test(goalText) || Number(goalText) > 2147483647)
    ) {
      setShowErrors(true);
      toast.error(
        "Enter a whole-naira goal no greater than ₦2,147,483,647, or leave it blank for your draft.",
      );
      jump("goal");
      return;
    }
    savingLock.current = true;
    mutation.mutate({ submit: false, exit });
  };
  if (done)
    return (
      <Submitted
        campaign={done}
        onView={() => void navigate({ to: "/campaign/$id", params: { id: done.id } })}
      />
    );
  return (
    <div className="designer-app min-h-screen bg-paper font-gsf text-heading">
      <header className="sticky top-0 z-30 border-b border-line-soft bg-paper/90 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-4 max-[360px]:gap-2 sm:px-6">
          <Link
            to="/dashboard"
            onClick={(event) => {
              event.preventDefault();
              saveDraft(true);
            }}
            aria-disabled={busy}
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
            {draftState.title?.trim() || "New campaign"}
          </p>
          <Tag>Draft</Tag>
          <span className="hidden text-[13px] text-muted-ink md:inline">
            {mutation.isPending ? "Saving..." : dirty || !savedId ? "Unsaved changes" : "Saved"}
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
            disabled={busy}
            title={
              missing.length
                ? `Still to do: ${missing.map((m) => m.label.toLowerCase()).join(", ")}`
                : undefined
            }
            className={btn("primary", "sm")}
          >
            {mutation.isPending ? (
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
          <fieldset disabled={busy} className="contents">
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
                        aria-checked={draftState.mode === o.v}
                        onClick={() => setDraft({ mode: o.v })}
                        className={cn(
                          "flex flex-col items-start rounded-[9px] px-3 py-2 text-left transition-all",
                          draftState.mode === o.v
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
                        (draftState.title?.length ?? 0) > 150 ? "text-danger" : "text-subtle",
                      )}
                    >
                      {draftState.title?.length ?? 0}/150
                    </span>
                  </span>
                  <input
                    value={draftState.title ?? ""}
                    maxLength={150}
                    onChange={(e) => setDraft({ title: e.target.value })}
                    placeholder="e.g. 20 bunk beds for new children at Grace Harvest, Jos"
                    className={cn(inputClass, err("title") && "border-danger")}
                  />
                  <span className="text-[12px] text-muted-ink">
                    Say what it is and where. Givers decide from the title.
                  </span>
                  {err("title") ? (
                    <FieldError>
                      {allErrors.title || "Use a title of 8 to 150 characters."}
                    </FieldError>
                  ) : null}
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Asking for"
                    value={draftState.type ?? ""}
                    onChange={(v) =>
                      setDraft({ type: (v || undefined) as Campaign["type"] | undefined })
                    }
                    options={types.map((t) => ({ value: t.v, label: t.label }))}
                    placeholder="Choose"
                  />
                  <SelectField
                    label="Cause"
                    value={draftState.faithCategory ?? ""}
                    onChange={(v) =>
                      setDraft({ faithCategory: (v || undefined) as Category | undefined })
                    }
                    options={categories.map((c) => ({ value: c.label, label: c.label }))}
                    placeholder="Choose"
                    error={err("cause") && !draftState.faithCategory}
                  />
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Town and state</span>
                  <input
                    value={draftState.location ?? ""}
                    onChange={(e) => setDraft({ location: e.target.value })}
                    placeholder="e.g. Jos, Plateau State"
                    className={cn(
                      inputClass,
                      err("cause") && !draftState.location?.trim() && "border-danger",
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
                  value={draftState.story ?? ""}
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
                    {(draftState.story ?? "").includes("[")
                      ? "Replace the [bracketed] parts with your own words."
                      : "Numbers help: “20 bunk beds at ₦60,000 each” beats “beds for the children”."}
                  </span>
                  <span className="shrink-0 text-[12px] text-subtle">
                    {countWords(draftState.story ?? "")} / 200 words
                  </span>
                </div>
                {err("story") ? (
                  <FieldError>
                    {allErrors.story || "Write 100 to 200 words and fill in every bracketed part."}
                  </FieldError>
                ) : null}
              </Section>

              <Section
                id="photos"
                title="Photos"
                note="Real photos of the people and the place. No stock images."
              >
                <CampaignUploads
                  cover
                  folder="campaign-cover"
                  urls={form.coverImageUrl ? [form.coverImageUrl] : []}
                  limit={1}
                  disabled={busy}
                  onChange={(urls) => change({ coverImageUrl: urls[0] ?? "" })}
                  onBusy={onBusy}
                  error={errors.coverImageUrl}
                />
                <CampaignUploads
                  folder="campaign-gallery"
                  urls={form.galleryImageUrls}
                  limit={8}
                  disabled={busy}
                  onChange={(galleryImageUrls) => change({ galleryImageUrls })}
                  onBusy={onBusy}
                  error={errors.galleryImageUrls}
                />
                <p className="text-[12px] text-subtle">
                  JPEG, PNG or WebP, up to 5 MB each. A cover and at least one gallery photo are
                  required.
                </p>
              </Section>

              <Section
                id="goal"
                title={draftState.mode === "ongoing" ? "Regular giving" : "Goal"}
                note={
                  draftState.mode === "ongoing"
                    ? "Givers choose from the options you allow."
                    : "What the whole thing costs. Givers see how close you are."
                }
              >
                {draftState.mode === "ongoing" ? (
                  <div className="flex flex-wrap gap-2">
                    {(["weekly", "monthly", "quarterly"] as const).map((f) => {
                      const on = draftState.frequencies?.includes(f) ?? false;
                      return (
                        <button
                          key={f}
                          type="button"
                          aria-pressed={on}
                          onClick={() =>
                            setDraft({
                              frequencies: on
                                ? (draftState.frequencies ?? []).filter((x) => x !== f)
                                : [...(draftState.frequencies ?? []), f],
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
                    {draftState.type === "money" ||
                    draftState.type === "emergency" ||
                    !draftState.type ? (
                      <label className="flex max-w-[320px] flex-col gap-1.5">
                        <span className={labelClass}>Amount needed</span>
                        <span className="relative">
                          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-ink">
                            ₦
                          </span>
                          <input
                            aria-label="Amount needed"
                            type="text"
                            inputMode="numeric"
                            value={draftState.goal ?? ""}
                            onChange={(e) =>
                              change({ goalAmount: formatCheckoutInput(e.target.value) })
                            }
                            placeholder="1,200,000"
                            className={cn(inputClass, "pl-8", err("goal") && "border-danger")}
                          />
                        </span>
                        {err("goal") ? (
                          <FieldError>
                            {allErrors.goalAmount || "Set a goal of at least ₦5,000."}
                          </FieldError>
                        ) : null}
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
                            aria-pressed={(draftState.urgency ?? "medium") === u}
                            onClick={() => setDraft({ urgency: u })}
                            className={cn(
                              "h-9 rounded-[9px] text-[13px] font-medium capitalize transition-all",
                              (draftState.urgency ?? "medium") === u
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
                note="Link one of your organizations, or create a standalone campaign. Only approved records are public."
              >
                <SelectField
                  label="Raising for"
                  value={draftState.orgId ?? ""}
                  onChange={(v) => setDraft({ orgId: v || undefined })}
                  options={orgs.map((o) => ({ value: o.id, label: o.name }))}
                  placeholder="Myself (a personal campaign)"
                />
                {profile.isError && (
                  <LoadError
                    message="Could not load your organizations. Retry before submitting."
                    retry={() => void profile.refetch()}
                  />
                )}
                {profile.isPending && (
                  <p role="status" className="text-sm text-muted-ink">
                    Loading your organizations...
                  </p>
                )}
                {errors.organizationId && <FieldError>{errors.organizationId}</FieldError>}
                {org && org.verificationStatus !== "verified" ? (
                  <p className="rounded-field bg-panel px-4 py-3 text-[13px] text-ink-soft">
                    {org.name} isn't verified yet. You can submit now; the campaign goes live once
                    they are.
                  </p>
                ) : null}
              </Section>

              {["ITEM", "VOLUNTEER", "PROFESSIONAL"].includes(form.type) && (
                <Section
                  id="needs"
                  title="What help do you need?"
                  note="List the specific items, volunteer roles or professional skills."
                >
                  <div className="flex gap-2">
                    <input
                      aria-label="Add a need"
                      className={inputClass}
                      value={need}
                      onChange={(e) => {
                        setNeed(e.target.value);
                        setNeedError("");
                      }}
                    />
                    <button
                      type="button"
                      className={btn("secondary")}
                      onClick={() => {
                        const value = need.trim();
                        if (
                          !value ||
                          value.length > 300 ||
                          form.needs.length >= 8 ||
                          form.needs.includes(value)
                        ) {
                          setNeedError(
                            "Add up to 8 different needs, each with 1 to 300 characters.",
                          );
                          return;
                        }
                        change({ needs: [...form.needs, value] });
                        setNeed("");
                        setNeedError("");
                      }}
                    >
                      Add
                    </button>
                  </div>
                  {(needError || errors.needs) && (
                    <FieldError>{needError || errors.needs}</FieldError>
                  )}
                  <ul className="flex flex-col gap-2">
                    {form.needs.map((item, i) => (
                      <li
                        key={item}
                        className="flex items-center justify-between gap-3 rounded-field bg-panel p-3 text-sm text-ink-soft"
                      >
                        <span className="min-w-0 break-words">{item}</span>
                        <button
                          type="button"
                          aria-label={"Remove need " + (i + 1)}
                          onClick={() => change({ needs: form.needs.filter((_, j) => j !== i) })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              <CampaignPayoutAccount
                account={payout.data}
                loading={payout.isFetching}
                failed={payout.isError}
                message={errors.payoutAccount}
                retry={() => void payout.refetch()}
                organizationId={form.organizationId || undefined}
                appearance="app"
              />
              <div className="flex flex-col-reverse gap-3 border-t border-line-soft pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => saveDraft(false)}
                  className={btn("secondary")}
                >
                  Save draft
                </button>
                <button type="button" onClick={submit} disabled={busy} className={btn("primary")}>
                  {mutation.isPending ? "Submitting..." : "Submit for review"}
                </button>
              </div>
            </div>
          </fieldset>
          {mutation.error && (
            <p
              role="alert"
              className="mx-auto mt-5 max-w-[640px] rounded-field bg-panel p-4 text-sm text-danger"
            >
              {mutation.error.message} Your details are still here.
            </p>
          )}
        </main>

        <aside className="hidden border-l border-line-soft bg-panel/40 lg:block">
          <div className="sticky top-14 max-h-[calc(100vh-56px)] overflow-y-auto p-6">
            <Preview draft={draftState} orgName={org?.name} />
          </div>
        </aside>
      </div>

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[88vh] overflow-y-auto rounded-t-card p-5"
          aria-describedby={undefined}
        >
          <SheetTitle className="sr-only">Preview</SheetTitle>
          <Preview draft={draftState} orgName={org?.name} />
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

function previewOf(d: Draft, me: { name: string; avatar: string }): Campaign {
  return {
    id: "preview",
    ownerId: "preview",
    isPublic: false,
    isDraft: true,
    mode: d.mode ?? "one-time",
    type: d.type ?? "money",
    title: d.title?.trim() || "Your campaign title",
    story: d.story ?? "",
    faithCategory: d.faithCategory ?? categories[0].label,
    orgId: d.orgId,
    raiser: { name: me.name, avatar: me.avatar, location: d.location ?? "" },
    cover: d.cover ?? placeholderCover,
    gallery: d.gallery ?? [],
    goal:
      d.mode !== "ongoing" &&
      Number.isSafeInteger(Number(String(d.goal).replaceAll(",", ""))) &&
      Number(String(d.goal).replaceAll(",", "")) > 0
        ? Number(String(d.goal).replaceAll(",", ""))
        : undefined,
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
    frequencies: d.mode === "ongoing" ? (d.frequencies ?? []) : undefined,
  };
}

/** Live preview with two views: the card in Discover, and the top of the campaign page. */
function Preview({ draft, orgName }: { draft: Draft; orgName?: string }) {
  const user = useAppSelector((s) => s.auth.user);
  const me = { name: user?.fullName ?? "Your name", avatar: user?.avatarUrl ?? "" };
  const [view, setView] = useState<"page" | "card">("page");
  const c = previewOf(draft, me);
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
                <UserAvatar
                  src={me.avatar}
                  name={me.name}
                  className="h-4 w-4 bg-panel text-[8px]"
                />
                {me.name}
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
    {
      label: "We review it",
      note: "The team checks your campaign",
      done: campaign.verificationStatus === "verified",
    },
    {
      label: "It goes live",
      note: "Only approved public campaigns accept gifts",
      done: isPublished(campaign),
    },
    { label: "Share it", note: "Your congregation first", done: false },
  ];
  return (
    <div className="designer-app min-h-screen bg-panel px-6 py-10 font-gsf">
      <div className="mx-auto flex max-w-[520px] flex-col items-center gap-6">
        <Link to="/" aria-label="AzarFaith home">
          <AuthLogo />
        </Link>
        <div className="admin-rise w-full rounded-card bg-paper p-6 shadow-[0_24px_64px_-24px_rgba(19,14,48,0.25)] sm:p-8">
          <h1 className="font-display text-[28px] leading-tight text-ink">
            {isPublished(campaign) ? "Campaign approved" : "Submitted for review"}
          </h1>
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
