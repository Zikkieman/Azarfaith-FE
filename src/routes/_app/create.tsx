import placeholderCover from "@/assets/placeholder-cover.svg";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Briefcase,
  Check,
  ChevronDown,
  Flame,
  HandCoins,
  ImagePlus,
  Package,
  Repeat2,
  Siren,
  Target,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  AppShell,
  BackLink,
  ChoiceCard,
  Container,
  FieldError,
  FlowTitle,
  Notice,
  OptionButton,
  Stepper,
  Tag,
  inputClass,
  labelClass,
  pageTitleClass,
  smallHeadingClass,
} from "@/components/app/AppShell";
import { btn, btnPrimary, btnSecondary } from "@/components/app/btn";
import { useApp } from "@/lib/store";
import { categories, formatMoney, me, type Campaign } from "@/lib/mock";
import { CampaignCard } from "@/components/CampaignCard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/create")({
  head: () => ({ meta: [{ title: "Start a campaign — AzarFaith" }] }),
  component: CreateCampaign,
});

const campaignTypes = [
  { v: "money", label: "Raise funds", desc: "A money goal for one need", icon: HandCoins },
  {
    v: "item",
    label: "Request items",
    desc: "Beds, books, food, building materials",
    icon: Package,
  },
  { v: "volunteer", label: "Find volunteers", desc: "People to give their time", icon: Users },
  {
    v: "professional",
    label: "Professional help",
    desc: "Doctors, builders, teachers, lawyers",
    icon: Briefcase,
  },
  { v: "emergency", label: "Emergency", desc: "Urgent help after a crisis", icon: Siren },
] as const;

const urgencyOptions = [
  { v: "low", label: "Low", desc: "No rush, we'll get there" },
  { v: "medium", label: "Medium", desc: "An active need, not critical" },
  { v: "high", label: "High", desc: "We need this soon" },
  { v: "critical", label: "Critical", desc: "An emergency, act now" },
] as const;

const frequencyOptions = [
  { v: "weekly", label: "Weekly" },
  { v: "monthly", label: "Monthly" },
  { v: "quarterly", label: "Quarterly" },
] as const;

function CreateCampaign() {
  const nav = useNavigate();
  const { draft, setDraft, resetDraft, addCampaign, orgs } = useApp();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState<Campaign | null>(null);

  useEffect(() => setErrors({}), [draft]);

  const isOngoing = draft.mode === "ongoing";
  const steps = isOngoing
    ? ["Kind", "Need", "Story", "Details", "Frequency", "Preview"]
    : ["Kind", "Need", "Story", "Details", "Preview"];
  const isPreview = step === steps.length - 1;

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 0 && !draft.mode) e.mode = "Choose the kind of campaign";
    if (step === 1 && !draft.type) e.type = "Choose what you're asking for";
    if (step === 2) {
      if (!draft.title?.trim() || draft.title.length < 8)
        e.title = "The title needs at least 8 characters";
      if (!draft.story?.trim() || draft.story.length < 30)
        e.story = "The story needs at least 30 characters";
    }
    if (step === 3) {
      if (!draft.faithCategory) e.faithCategory = "Choose a cause";
      if (!draft.location?.trim()) e.location = "Add a location";
      if (!isOngoing && draft.type === "money" && (!draft.goal || draft.goal < 1000))
        e.goal = "The goal needs to be at least ₦1,000";
    }
    if (step === 4 && isOngoing && !draft.frequencies?.length)
      e.frequencies = "Choose at least one frequency";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validate()) setStep((s) => s + 1);
  };
  const back = () => setStep((s) => Math.max(0, s - 1));
  const saveDraft = () => toast("Draft saved");

  const publish = () => {
    setPublishing(true);
    setTimeout(() => {
      const campaign: Campaign = {
        id: `gfc${Math.random().toString(36).slice(2)}`,
        mode: draft.mode!,
        type: draft.type!,
        title: draft.title!,
        story: draft.story!,
        faithCategory: draft.faithCategory!,
        orgId: draft.orgId,
        raiser: {
          name: "Tunde Adebayo",
          avatar:
            "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=200&q=80",
          location: draft.location!,
          trustScore: 86,
        },
        cover: draft.cover ?? placeholderCover,
        gallery: [],
        goal: isOngoing ? undefined : draft.goal,
        raised: 0,
        donors: 0,
        currency: "NGN",
        location: draft.location!,
        urgency: draft.urgency ?? "medium",
        createdAt: new Date().toISOString().split("T")[0],
        verificationStatus: "unverified",
        updates: [],
        comments: [],
        donations: [],
        needs: draft.needs,
        frequencies: isOngoing ? (draft.frequencies ?? ["monthly"]) : undefined,
      };
      addCampaign(campaign);
      setPublishing(false);
      setDone(campaign);
    }, 900);
  };

  if (done) {
    return (
      <AppShell>
        <Container className="flex flex-col items-center py-20 text-center md:py-28">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-brand text-white animate-pop">
            <Check className="h-10 w-10" strokeWidth={2} />
          </span>
          <h1 className={`${pageTitleClass} mt-8`}>Submitted for review</h1>
          <p className="mt-4 max-w-[540px] text-lg leading-[1.55] tracking-[-0.02em] text-ink-soft">
            We'll let you know once it's approved, or if we need anything else from you.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                resetDraft();
                nav({ to: "/campaign/$id", params: { id: done.id } });
              }}
              className={btnPrimary}
            >
              View campaign
            </button>
            <Link to="/dashboard" onClick={() => resetDraft()} className={btnSecondary}>
              Back to Manage
            </Link>
          </div>
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Container className="py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-10">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4">
                {step > 0 ? (
                  <BackLink onClick={back}>Back</BackLink>
                ) : (
                  <BackLink to="/dashboard">Back to Manage</BackLink>
                )}
                <button type="button" onClick={saveDraft} className={btn("quiet", "sm")}>
                  Save draft
                </button>
              </div>
              <Stepper steps={steps} current={step} />
            </div>

            {step === 0 ? (
              <Step
                title="What kind of campaign?"
                sub="Choose based on what your cause actually needs."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <ChoiceCard
                    selected={draft.mode === "one-time"}
                    onClick={() => setDraft({ mode: "one-time" })}
                    icon={<Target className="h-5 w-5" strokeWidth={1.5} />}
                    title="One-time campaign"
                    description="A set amount for one thing, like a roof, a vehicle or an outreach."
                  />
                  <ChoiceCard
                    selected={draft.mode === "ongoing"}
                    onClick={() => setDraft({ mode: "ongoing" })}
                    icon={<Repeat2 className="h-5 w-5" strokeWidth={1.5} />}
                    title="Ongoing support"
                    description="Steady giving every week, month or quarter, with no end date."
                  />
                </div>
                <FieldError>{errors.mode}</FieldError>
              </Step>
            ) : null}

            {step === 1 ? (
              <Step
                title="What are you asking for?"
                sub="Even ongoing ministries can ask for more than money."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {campaignTypes.map(({ v, label, desc, icon: Icon }) => (
                    <ChoiceCard
                      key={v}
                      selected={draft.type === v}
                      onClick={() => setDraft({ type: v })}
                      icon={<Icon className="h-5 w-5" strokeWidth={1.5} />}
                      title={label}
                      description={desc}
                    />
                  ))}
                </div>
                <FieldError>{errors.type}</FieldError>
              </Step>
            ) : null}

            {step === 2 ? (
              <Step title="Tell your story" sub="Be specific. Real details build trust.">
                <UploadBox label="Cover photo" hint="Add a cover photo, up to 5MB" />
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Campaign title</span>
                  <input
                    className={inputClass}
                    placeholder={
                      isOngoing
                        ? "e.g. Support ECWA missionaries in Borno"
                        : "e.g. Build a church hall for ECWA Kano"
                    }
                    value={draft.title ?? ""}
                    onChange={(e) => setDraft({ title: e.target.value })}
                  />
                  <FieldError>{errors.title}</FieldError>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>
                    {isOngoing ? "Describe your ministry" : "What's the need?"}
                  </span>
                  <textarea
                    rows={6}
                    className={cn(inputClass, "resize-none")}
                    placeholder={
                      isOngoing
                        ? "Who you serve, what you do, and why it matters."
                        : "The specific need, what it costs, and how gifts will be used."
                    }
                    value={draft.story ?? ""}
                    onChange={(e) => setDraft({ story: e.target.value })}
                  />
                  <FieldError>{errors.story}</FieldError>
                </label>
                <UploadBox label="More photos" hint="Add photos of the work, up to 5MB each" tall />
              </Step>
            ) : null}

            {step === 3 ? (
              <Step title="Campaign details" sub="A few details so givers know what to expect.">
                <fieldset className="flex flex-col gap-2">
                  <legend className={`${labelClass} pb-2`}>Cause</legend>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(({ label, icon: Icon }) => (
                      <OptionButton
                        key={label}
                        selected={draft.faithCategory === label}
                        onClick={() => setDraft({ faithCategory: label })}
                        className="text-sm"
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.5} /> {label}
                      </OptionButton>
                    ))}
                  </div>
                  <FieldError>{errors.faithCategory}</FieldError>
                </fieldset>

                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Location</span>
                  <input
                    className={inputClass}
                    placeholder="e.g. Kano, Kano State"
                    value={draft.location ?? ""}
                    onChange={(e) => setDraft({ location: e.target.value })}
                  />
                  <FieldError>{errors.location}</FieldError>
                </label>

                {!isOngoing && draft.type === "money" ? (
                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>Goal</span>
                    <span className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-ink-soft">
                        ₦
                      </span>
                      <input
                        type="number"
                        inputMode="numeric"
                        className={cn(inputClass, "pl-8")}
                        placeholder="e.g. 8500000"
                        value={draft.goal ?? ""}
                        onChange={(e) => setDraft({ goal: parseInt(e.target.value) || 0 })}
                      />
                    </span>
                    <FieldError>{errors.goal}</FieldError>
                  </label>
                ) : null}

                {!isOngoing ? (
                  <fieldset className="flex flex-col gap-2">
                    <legend className={`${labelClass} pb-2`}>How urgent is it?</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {urgencyOptions.map(({ v, label, desc }) => (
                        <ChoiceCard
                          key={v}
                          selected={draft.urgency === v}
                          onClick={() => setDraft({ urgency: v })}
                          title={label}
                          description={desc}
                        />
                      ))}
                    </div>
                  </fieldset>
                ) : null}

                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>
                    Organization <span className="font-normal text-muted-ink">(optional)</span>
                  </span>
                  <span className="relative">
                    <select
                      className={cn(inputClass, "cursor-pointer appearance-none pr-10")}
                      value={draft.orgId ?? ""}
                      onChange={(e) => setDraft({ orgId: e.target.value || undefined })}
                    >
                      <option value="">None, this is a personal campaign</option>
                      {orgs.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink"
                      strokeWidth={2}
                    />
                  </span>
                </label>
              </Step>
            ) : null}

            {step === 4 && isOngoing ? (
              <Step
                title="How often can people give?"
                sub="Givers choose from the options you allow."
              >
                <div className="flex flex-col gap-3">
                  {frequencyOptions.map(({ v, label }) => {
                    const selected = draft.frequencies?.includes(v) ?? false;
                    return (
                      <ChoiceCard
                        key={v}
                        selected={selected}
                        onClick={() => {
                          const current = draft.frequencies ?? [];
                          setDraft({
                            frequencies: selected
                              ? current.filter((f) => f !== v)
                              : [...current, v],
                          });
                        }}
                        icon={<Repeat2 className="h-5 w-5" strokeWidth={1.5} />}
                        title={label}
                      />
                    );
                  })}
                </div>
                <FieldError>{errors.frequencies}</FieldError>
              </Step>
            ) : null}

            {isPreview ? (
              <Step title="Check it over" sub="This is what givers will see.">
                <div className="flex flex-col gap-4">
                  <div className="grid aspect-[16/9] place-items-center overflow-hidden rounded-card bg-panel text-muted-ink">
                    {draft.cover ? (
                      <img src={draft.cover} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlus className="h-10 w-10" strokeWidth={1.5} />
                    )}
                  </div>
                  <p className="flex flex-wrap gap-2">
                    <Tag>{isOngoing ? "Ongoing" : "One-time"}</Tag>
                    {draft.faithCategory ? <Tag>{draft.faithCategory}</Tag> : null}
                    {draft.type === "emergency" ? <Tag tone="brand">Urgent</Tag> : null}
                  </p>
                  <h2 className="font-display text-[clamp(24px,2.2vw,32px)] leading-[1.15] tracking-[-0.02em] text-ink">
                    {draft.title || "Your campaign title"}
                  </h2>
                  <p className="whitespace-pre-line text-[15px] leading-[1.6] text-ink-soft">
                    {draft.story}
                  </p>
                  {!isOngoing && draft.goal ? (
                    <p className="text-[15px] text-ink-soft">
                      Goal:{" "}
                      <span className="font-semibold text-ink">{formatMoney(draft.goal)}</span>
                    </p>
                  ) : null}
                  {isOngoing && draft.frequencies?.length ? (
                    <p className="text-[15px] capitalize text-ink-soft">
                      {draft.frequencies.join(", ")}
                    </p>
                  ) : null}
                </div>
                <Notice>
                  Your campaign goes live with an <strong>unverified</strong> tag. You can ask for
                  verification from the campaign page once it's published.
                </Notice>
                {draft.type === "emergency" ? (
                  <Notice>
                    <Flame className="mr-1.5 inline h-4 w-4 text-brand" strokeWidth={1.5} />
                    Emergency campaigns are shown with an Urgent tag.
                  </Notice>
                ) : null}
              </Step>
            ) : null}

            <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-6 [&>button]:flex-1 sm:[&>button]:flex-none">
              {isPreview ? (
                <button type="button" onClick={saveDraft} className={btnSecondary}>
                  Save draft
                </button>
              ) : step > 0 ? (
                <button type="button" onClick={back} className={btnSecondary}>
                  Back
                </button>
              ) : (
                <span />
              )}
              {isPreview ? (
                <button
                  type="button"
                  onClick={publish}
                  disabled={publishing}
                  className={btnPrimary}
                >
                  {publishing ? "Submitting…" : "Submit for review"}
                </button>
              ) : (
                <button type="button" onClick={next} className={btnPrimary}>
                  Continue
                </button>
              )}
            </div>
          </div>

          <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <p className={`${smallHeadingClass} pb-3`}>Preview</p>
            <div inert className="pointer-events-none">
              <CampaignCard campaign={previewOf(draft, isOngoing)} />
            </div>
          </aside>
        </div>
      </Container>
    </AppShell>
  );
}

/** The draft as a campaign, so the side panel can show the real card filling in. */
function previewOf(
  draft: ReturnType<typeof useApp.getState>["draft"],
  isOngoing: boolean,
): Campaign {
  return {
    id: "preview",
    mode: draft.mode ?? "one-time",
    type: draft.type ?? "money",
    title: draft.title || "Your campaign title",
    story: draft.story ?? "",
    faithCategory: draft.faithCategory ?? categories[0].label,
    orgId: draft.orgId,
    raiser: { name: me.name, avatar: me.avatar, location: draft.location ?? "", trustScore: 0 },
    cover: draft.cover ?? placeholderCover,
    gallery: [],
    goal: !isOngoing && draft.goal ? draft.goal : undefined,
    raised: 0,
    donors: 0,
    currency: "NGN",
    location: draft.location ?? "",
    urgency: draft.urgency ?? "medium",
    createdAt: "",
    verificationStatus: "unverified",
    updates: [],
    comments: [],
    donations: [],
    frequencies: isOngoing
      ? draft.frequencies?.length
        ? draft.frequencies
        : ["monthly"]
      : undefined,
  };
}

function Step({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <FlowTitle title={title} sub={sub} />
      {children}
    </div>
  );
}

function UploadBox({ label, hint, tall }: { label: string; hint: string; tall?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      <button
        type="button"
        onClick={() => toast("Photo upload is coming soon")}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line-input bg-panel px-4 text-sm text-muted-ink transition-colors hover:border-ink hover:text-ink",
          tall ? "h-[140px]" : "h-[96px]",
        )}
      >
        <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
        {hint}
      </button>
    </div>
  );
}
