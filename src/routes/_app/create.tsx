import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { AuthField } from "@/components/auth/AuthField";
import { useApp } from "@/lib/store";
import { categories, type Campaign } from "@/lib/mock";
import { toast } from "sonner";
import {
  Repeat2,
  Check,
  ImagePlus,
  Flame,
  ChevronLeft,
  ArrowRight,
  PartyPopper,
} from "lucide-react";
import modeOnetime from "@/assets/create/mode-onetime.png";
import modeOngoing from "@/assets/create/mode-ongoing.png";
import typeSticker from "@/assets/create/type-sticker.png";

export const Route = createFileRoute("/_app/create")({
  head: () => ({ meta: [{ title: "Start a campaign — AzarFaith" }] }),
  component: AzarFaithCreate,
});

const campaignTypes = [
  { v: "money", label: "Raise Funds" },
  { v: "item", label: "Request Items" },
  { v: "volunteer", label: "Find Volunteers" },
  { v: "professional", label: "Professional Help" },
  { v: "emergency", label: "Emergency" },
] as const;

const urgencyOptions = [
  { v: "low", label: "Low", desc: "No rush — we'll get there" },
  { v: "medium", label: "Medium", desc: "Active need, not critical" },
  { v: "high", label: "High", desc: "We need this soon" },
  { v: "critical", label: "Critical", desc: "Emergency — act now" },
] as const;

const frequencyOptions = [
  { v: "weekly", label: "Weekly" },
  { v: "monthly", label: "Monthly" },
  { v: "quarterly", label: "Quarterly" },
] as const;

function AzarFaithCreate() {
  const nav = useNavigate();
  const { draft, setDraft, resetDraft, addCampaign, orgs } = useApp();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState<Campaign | null>(null);

  const isOngoing = draft.mode === "ongoing";
  const stepLabels = isOngoing
    ? [
        "Mode",
        "Select Campaign Type",
        "Enter Story",
        "Campaign Details",
        "Giving Frequencies",
        "Preview and Publish",
      ]
    : ["Mode", "Select Campaign Type", "Enter Story", "Campaign Details", "Preview and Publish"];
  const totalSteps = stepLabels.length;
  const isPreview = step === totalSteps - 1;

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 0 && !draft.mode) e.mode = "Choose a campaign mode";
    if (step === 1 && !draft.type) e.type = "Choose a type";
    if (step === 2) {
      if (!draft.title?.trim() || draft.title.length < 8)
        e.title = "Title must be at least 8 characters";
      if (!draft.story?.trim() || draft.story.length < 30)
        e.story = "Story must be at least 30 characters";
    }
    if (step === 3) {
      if (!draft.faithCategory) e.faithCategory = "Select a category";
      if (!draft.location?.trim()) e.location = "Location is required";
      if (!isOngoing && draft.type === "money" && (!draft.goal || draft.goal < 1000))
        e.goal = "Goal must be at least ₦1,000";
    }
    if (step === 4 && isOngoing) {
      if (!draft.frequencies?.length) e.frequencies = "Select at least one giving frequency";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate()) return;
    setStep((s) => s + 1);
  };

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
        cover:
          draft.cover ??
          "https://images.unsplash.com/photo-1532635241-17e820acc59f?auto=format&fit=crop&w=1200&q=80",
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

  return (
    <div className="flex min-h-screen bg-paper font-gsf">
      <aside className="hidden w-[310px] shrink-0 bg-black px-10 py-14 lg:block">
        <Link to="/">
          <AuthLogo className="flex items-center gap-[3px] [&_img:last-child]:brightness-0 [&_img:last-child]:invert" />
        </Link>
        <nav className="mt-14 flex flex-col gap-4">
          {stepLabels.map((label, i) => (
            <div
              key={label}
              className={`flex items-center gap-1.5 text-sm font-bold ${
                i === step ? "text-white" : "text-white/70"
              }`}
            >
              {i === step && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#fe5102]" />}
              {label}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <div className="sticky top-0 z-20 border-b border-line-soft bg-paper px-6 pb-4 pt-5 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                aria-label="Back"
                className="-ml-2 grid h-10 w-10 place-items-center text-heading"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            ) : (
              <Link to="/">
                <AuthLogo />
              </Link>
            )}
            <div className="flex items-center gap-4 text-sm text-heading">
              <button
                type="button"
                onClick={() => toast("Draft saved")}
                className="font-bold underline underline-offset-2"
              >
                Save draft
              </button>
              <Link to="/dashboard">Close</Link>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[13px] text-muted-ink">
            <span className="font-semibold text-ink">{stepLabels[step]}</span>
            <span>
              Step {step + 1} of {totalSteps}
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-line-soft">
            <div
              className="h-1 rounded-full bg-[#FE5102] transition-[width] duration-300"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
        <div className="hidden items-center justify-between px-6 py-4 md:px-12 lg:flex">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              aria-label="Back"
              className="text-heading"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2 text-sm text-heading">
            <button
              type="button"
              onClick={() => toast("Draft saved")}
              className="font-bold underline underline-offset-2"
            >
              Save as Draft
            </button>
            <Link to="/dashboard">Close</Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-2xl flex-1 px-6 pb-16 md:px-12">
          {step === 0 && (
            <ModeStep
              mode={draft.mode}
              onSelect={(mode) => setDraft({ mode })}
              error={errors.mode}
            />
          )}
          {step === 1 && (
            <TypeStep
              type={draft.type}
              onSelect={(type) => setDraft({ type })}
              error={errors.type}
            />
          )}
          {step === 2 && (
            <StoryStep
              isOngoing={isOngoing}
              title={draft.title}
              story={draft.story}
              cover={draft.cover}
              errors={errors}
              onChange={setDraft}
            />
          )}
          {step === 3 && (
            <DetailsStep
              isOngoing={isOngoing}
              type={draft.type}
              faithCategory={draft.faithCategory}
              location={draft.location}
              goal={draft.goal}
              urgency={draft.urgency}
              orgId={draft.orgId}
              orgs={orgs}
              errors={errors}
              onChange={setDraft}
            />
          )}
          {step === 4 && isOngoing && (
            <FrequenciesStep
              frequencies={draft.frequencies}
              error={errors.frequencies}
              onChange={(frequencies) => setDraft({ frequencies })}
            />
          )}
          {isPreview && (
            <PreviewStep
              isOngoing={isOngoing}
              draft={draft}
              publishing={publishing}
              onSaveDraft={() => toast("Draft saved")}
              onPublish={publish}
            />
          )}

          {!isPreview && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={next}
                className="w-full rounded-[8px] bg-btn px-6 py-3.5 text-sm font-semibold text-btn-fg hover:bg-btn/90 sm:w-auto sm:py-3"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>

      {done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-5">
          <div className="flex w-full max-w-[460px] flex-col items-center gap-8 bg-paper p-8 text-center">
            <PartyPopper className="h-12 w-12 text-[#fe5102]" strokeWidth={1.5} />
            <div className="flex flex-col gap-2.5">
              <p className="font-display text-3xl text-heading">Completed.</p>
              <p className="text-sm text-heading">
                Your campaign has been submitted for review. We will notify you once it has been
                approved or if further action is needed. Thank you for your support!
              </p>
            </div>
            <button
              onClick={() => {
                resetDraft();
                nav({ to: "/campaign/$id", params: { id: done.id } });
              }}
              className="w-full rounded-[8px] bg-btn px-4 py-3 text-sm font-semibold text-btn-fg hover:bg-btn/90"
            >
              View campaign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-3 pb-7 pt-6 sm:pb-10">
      <h1 className="font-display text-[clamp(32px,8.5vw,48px)] leading-[1.08] tracking-[-0.03em] text-ink">
        {title}
      </h1>
      <p className="text-sm text-heading">{subtitle}</p>
    </div>
  );
}

function ModeStep({
  mode,
  onSelect,
  error,
}: {
  mode?: Campaign["mode"];
  onSelect: (mode: Campaign["mode"]) => void;
  error?: string;
}) {
  return (
    <div>
      <StepHeading
        title="What kind of campaign?"
        subtitle="Choose based on what your cause actually needs."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <ModeCard
          sticker={modeOnetime}
          label="One-time campaign"
          desc="You need a set amount for one thing, like a roof, a vehicle or an outreach."
          selected={mode === "one-time"}
          onClick={() => onSelect("one-time")}
        />
        <ModeCard
          sticker={modeOngoing}
          label="Ongoing support"
          desc="Your work needs steady giving every week, month or quarter, with no end date."
          selected={mode === "ongoing"}
          onClick={() => onSelect("ongoing")}
        />
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ModeCard({
  sticker,
  label,
  desc,
  selected,
  onClick,
}: {
  sticker: string;
  label: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center gap-4 rounded-lg px-5 py-5 text-left transition sm:flex-col sm:gap-3 sm:px-7 sm:py-8 sm:text-center ${
        selected ? "bg-peach ring-1 ring-[#fe5102]" : "bg-panel hover:bg-panel"
      }`}
    >
      <img
        src={sticker}
        alt=""
        className="h-16 w-16 shrink-0 object-contain sm:h-[99px] sm:w-auto"
      />
      <span className="flex flex-col gap-1.5 sm:items-center sm:gap-3">
        <span className="flex items-center gap-1.5 text-sm font-bold text-heading">
          {label}
          {selected && <Check className="h-4 w-4 text-[#fe5102]" />}
        </span>
        <span className="text-sm text-heading">{desc}</span>
      </span>
    </button>
  );
}

function TypeStep({
  type,
  onSelect,
  error,
}: {
  type?: Campaign["type"];
  onSelect: (type: Campaign["type"]) => void;
  error?: string;
}) {
  return (
    <div>
      <StepHeading
        title="What are you asking for?"
        subtitle="Even ongoing ministries can request more than just money."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {campaignTypes.map(({ v, label }) => (
          <button
            key={v}
            type="button"
            onClick={() => onSelect(v)}
            className={`flex items-center gap-3.5 rounded-lg px-7 py-3 text-left transition ${
              type === v ? "bg-peach ring-1 ring-[#fe5102]" : "bg-panel hover:bg-panel"
            }`}
          >
            <img src={typeSticker} alt="" className="h-[63px] w-auto shrink-0 object-contain" />
            <div className="flex-1 text-sm font-bold text-heading">{label}</div>
            {type === v && <Check className="h-4 w-4 shrink-0 text-[#fe5102]" />}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function StoryStep({
  isOngoing,
  title,
  story,
  cover,
  errors,
  onChange,
}: {
  isOngoing: boolean;
  title?: string;
  story?: string;
  cover?: string;
  errors: Record<string, string>;
  onChange: (d: { title?: string; story?: string; cover?: string }) => void;
}) {
  return (
    <div>
      <StepHeading title="Tell your story" subtitle="Be specific. Real details build trust." />
      <div className="flex flex-col gap-4">
        <UploadBox label="Upload campaign cover" hint="Click to upload (max 5MB)" />
        <AuthField
          label="Campaign title"
          placeholder={
            isOngoing
              ? "e.g. Support ECWA Missionaries in Borno"
              : "e.g. Build a church hall for ECWA Kano"
          }
          value={title ?? ""}
          onChange={(e) => onChange({ title: e.target.value })}
          error={errors.title}
        />
        <div className="flex w-full flex-col items-start gap-[2px]">
          <label className="text-[14px] font-semibold leading-[26.25px] text-heading">
            {isOngoing ? "Describe your ministry" : "What's the need?"}
          </label>
          <textarea
            rows={5}
            className="w-full resize-none rounded-[8px] border border-line-input px-3 py-2 text-sm shadow-[0px_1px_1px_rgba(16,24,40,0.05)] focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder={
              isOngoing
                ? "Tell donors about your ministry — who you serve, what you do, why it matters."
                : "Explain the specific need. Include amounts, why they're needed, and how donations will be used."
            }
            value={story ?? ""}
            onChange={(e) => onChange({ story: e.target.value })}
          />
          {errors.story && <p className="text-xs text-destructive">{errors.story}</p>}
        </div>
        <UploadBox label="Upload campaign gallery" hint="Click to upload (max 5MB)" tall />
      </div>
    </div>
  );
}

function UploadBox({ label, hint, tall }: { label: string; hint: string; tall?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => toast("Image upload coming soon")}
      className="flex w-full flex-col items-start gap-[3px]"
    >
      <span className="text-[14px] font-semibold leading-[26.25px] text-heading">{label}</span>
      <span
        className={`flex w-full items-center justify-center rounded-[8px] border border-dashed border-line-input px-3 text-sm text-heading/35 ${tall ? "h-[120px]" : "h-[72px]"}`}
      >
        {hint}
      </span>
    </button>
  );
}

function DetailsStep({
  isOngoing,
  type,
  faithCategory,
  location,
  goal,
  urgency,
  orgId,
  orgs,
  errors,
  onChange,
}: {
  isOngoing: boolean;
  type?: Campaign["type"];
  faithCategory?: Campaign["faithCategory"];
  location?: string;
  goal?: number;
  urgency?: Campaign["urgency"];
  orgId?: string;
  orgs: { id: string; name: string }[];
  errors: Record<string, string>;
  onChange: (d: Partial<Campaign> & { orgId?: string }) => void;
}) {
  return (
    <div>
      <StepHeading
        title="Campaign details"
        subtitle="A few more details so donors know what to expect."
      />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[14px] font-semibold leading-[26.25px] text-heading">
            Faith category
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => onChange({ faithCategory: label })}
                aria-pressed={faithCategory === label}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  faithCategory === label
                    ? "border-ink bg-ink text-ink-contrast"
                    : "border-line bg-paper text-ink-soft hover:border-ink"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} /> {label}
              </button>
            ))}
          </div>
          {errors.faithCategory && (
            <p className="text-xs text-destructive">{errors.faithCategory}</p>
          )}
        </div>

        <AuthField
          label="Location"
          placeholder="e.g. Kano, Nigeria"
          value={location ?? ""}
          onChange={(e) => onChange({ location: e.target.value })}
          error={errors.location}
        />

        {!isOngoing && type === "money" && (
          <AuthField
            label="Fundraising goal (₦)"
            type="number"
            placeholder="e.g. 8500000"
            value={goal ?? ""}
            onChange={(e) => onChange({ goal: parseInt(e.target.value) || 0 })}
            error={errors.goal}
          />
        )}

        {!isOngoing && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-semibold leading-[26.25px] text-heading">
              Urgency
            </label>
            <div className="grid grid-cols-2 gap-2">
              {urgencyOptions.map(({ v, label, desc }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onChange({ urgency: v })}
                  className={`flex flex-col rounded-[8px] border px-3 py-2.5 text-left transition ${
                    urgency === v ? "border-[#fe5102] bg-peach" : "border-line-input hover:bg-muted"
                  }`}
                >
                  <span className="text-sm font-medium text-heading">{label}</span>
                  <span className="text-xs text-muted-ink">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[14px] font-semibold leading-[26.25px] text-heading">
            Link to an org <span className="font-normal text-muted-ink">(optional)</span>
          </label>
          <select
            className="w-full rounded-[8px] border border-line-input px-3 py-2 text-sm shadow-[0px_1px_1px_rgba(16,24,40,0.05)] focus:outline-none focus:ring-1 focus:ring-ring"
            value={orgId ?? ""}
            onChange={(e) => onChange({ orgId: e.target.value || undefined })}
          >
            <option value="">No org — individual campaign</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function FrequenciesStep({
  frequencies,
  error,
  onChange,
}: {
  frequencies?: Campaign["frequencies"];
  error?: string;
  onChange: (f: NonNullable<Campaign["frequencies"]>) => void;
}) {
  return (
    <div>
      <StepHeading
        title="Giving frequencies"
        subtitle="Which frequencies do you want donors to be able to give at?"
      />
      <div className="flex flex-col gap-3">
        {frequencyOptions.map(({ v, label }) => {
          const selected = frequencies?.includes(v) ?? false;
          return (
            <button
              key={v}
              type="button"
              onClick={() => {
                const current = frequencies ?? [];
                onChange(selected ? current.filter((f) => f !== v) : [...current, v]);
              }}
              className={`flex items-center justify-between rounded-[8px] border px-4 py-3.5 transition ${
                selected ? "border-[#fe5102] bg-peach" : "border-line-input hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Repeat2 className={`h-4 w-4 ${selected ? "text-[#fe5102]" : "text-muted-ink"}`} />
                <span className="text-sm font-medium text-heading">{label}</span>
              </div>
              {selected && <Check className="h-4 w-4 text-[#fe5102]" />}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function PreviewStep({
  isOngoing,
  draft,
  publishing,
  onSaveDraft,
  onPublish,
}: {
  isOngoing: boolean;
  draft: {
    title?: string;
    story?: string;
    cover?: string;
    goal?: number;
    faithCategory?: Campaign["faithCategory"];
    frequencies?: Campaign["frequencies"];
    type?: Campaign["type"];
  };
  publishing: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
}) {
  return (
    <div>
      <h1 className="pt-6 font-display text-[clamp(30px,8vw,40px)] font-medium leading-[1.1] tracking-[-0.03em] text-ink">
        {draft.title || "Your campaign title"}
      </h1>

      <div className="mt-6 overflow-hidden rounded-3xl bg-muted">
        <div className="flex aspect-[16/9] items-center justify-center bg-muted">
          {draft.cover ? (
            <img src={draft.cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-10 w-10 text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${isOngoing ? "bg-ink text-ink-contrast" : "bg-panel text-ink"}`}
        >
          {isOngoing ? "Ongoing" : "One-time"}
        </span>
        {draft.faithCategory && (
          <span className="rounded-full bg-panel px-2.5 py-1 text-xs text-ink">
            {draft.faithCategory}
          </span>
        )}
      </div>

      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-heading">{draft.story}</p>

      {!isOngoing && draft.goal && (
        <p className="mt-4 text-sm text-heading">
          Goal: <span className="font-semibold">₦{draft.goal.toLocaleString()}</span>
        </p>
      )}
      {isOngoing && draft.frequencies && (
        <p className="mt-4 text-xs text-muted-ink">Give: {draft.frequencies.join(" · ")}</p>
      )}

      <div className="mt-6 rounded-xl border border-line bg-panel-olive p-4 text-sm text-ink-soft">
        Your campaign goes live with an <strong>unverified</strong> badge. You can request
        verification from the campaign page after publishing.
      </div>

      {draft.type === "emergency" && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#FE5102]/30 bg-peach p-3 text-sm text-ink">
          <Flame className="h-4 w-4 shrink-0 text-[#FE5102]" strokeWidth={1.5} />
          <span>This will be marked as an emergency campaign and shown with an urgent badge.</span>
        </div>
      )}

      <div className="mt-8 flex gap-2.5">
        <button
          type="button"
          onClick={onSaveDraft}
          className="flex flex-1 items-center justify-center rounded-[8px] border border-line-soft bg-paper px-4 py-3 text-sm font-semibold text-heading hover:bg-muted"
        >
          Save as Draft
        </button>
        <button
          type="button"
          disabled={publishing}
          onClick={onPublish}
          className="flex flex-1 items-center justify-center rounded-[8px] bg-btn px-4 py-3 text-sm font-semibold text-btn-fg hover:bg-btn/90 disabled:opacity-60"
        >
          {publishing ? "Submitting…" : "Submit for Review"}
        </button>
      </div>
    </div>
  );
}
