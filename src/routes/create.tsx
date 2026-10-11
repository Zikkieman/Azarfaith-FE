import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Eye, FileText, Plus, Repeat2, Siren, Trash2, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { PageSpinner } from "@/components/PageSpinner";
import { LoadError } from "@/components/profile/SettingsParts";
import {
  CreationLogo,
  CreationNotice,
  Field,
  MediaPicker,
} from "@/components/creation/CreationParts";
import { useCreationSession } from "@/components/creation/useCreationSession";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  getCampaignDraft,
  getProfile,
  saveCampaignDraft,
  submitCampaignDraft,
  updateCampaignDraft,
} from "@/features/catalog/api";
import {
  campaignTypeOptions,
  faithCategoryOptions,
  formatAmountInput,
  formatMoney,
  frequencyOptions,
  urgencyOptions,
  type Campaign,
} from "@/lib/catalog";
import {
  campaignErrors,
  campaignForm,
  campaignPayload,
  countWords,
  focusError,
  type CampaignForm,
} from "@/lib/creation";

export const Route = createFileRoute("/create")({
  validateSearch: (search: Record<string, unknown>): { draftId?: string } => ({
    draftId: typeof search.draftId === "string" ? search.draftId : undefined,
  }),
  component: CreateCampaign,
});
const templates = [
  {
    label: "Building project",
    line: "A roof, a hall, a classroom",
    icon: Warehouse,
    fields: { mode: "ONE_TIME", type: "MONEY", faithCategory: "CHURCH_BUILDING" },
  },
  {
    label: "Monthly support",
    line: "Missionaries, pastors, outreach",
    icon: Repeat2,
    fields: {
      mode: "ONGOING",
      type: "MONEY",
      faithCategory: "MISSIONS_OUTREACH",
      frequencies: ["MONTHLY"],
    },
  },
  {
    label: "Emergency relief",
    line: "Urgent help for your community",
    icon: Siren,
    fields: {
      mode: "ONE_TIME",
      type: "EMERGENCY",
      faithCategory: "EMERGENCY",
      urgency: "CRITICAL",
    },
  },
  { label: "Start blank", line: "Write it your way", icon: FileText, fields: {} },
] as const;
const checklist = [
  ["mode", "Choose campaign mode"],
  ["type", "Choose the kind of help"],
  ["title", "Give it a title"],
  ["faithCategory", "Choose a cause"],
  ["location", "Add your location"],
  ["story", "Tell your story"],
  ["coverImageUrl", "Upload a cover photo"],
  ["galleryImageUrls", "Add gallery photos"],
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
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [need, setNeed] = useState("");
  const [needError, setNeedError] = useState("");
  const [dirty, setDirty] = useState(false);
  const profile = useQuery({ queryKey: ["profile", userId], queryFn: getProfile });
  useCreationSession(profile.error);
  const change = (patch: Partial<CampaignForm>) => {
    setForm((current) => ({ ...current, ...patch }));
    setDirty(true);
  };
  const allErrors = campaignErrors(form);
  if (
    form.organizationId &&
    profile.data &&
    !profile.data.ownedOrganizations.some(
      (org) => org.id === form.organizationId && org.reviewAction !== "rejected",
    )
  )
    allErrors.organizationId =
      "Select one of your eligible organizations, or create a standalone campaign.";
  const errors = showErrors ? allErrors : {};
  const checks: Array<readonly [string, string]> = [...checklist];
  if (form.mode === "ONE_TIME" && form.type === "MONEY")
    checks.push(["goalAmount", "Set your goal"]);
  if (form.mode === "ONGOING") checks.push(["frequencies", "Choose giving frequencies"]);
  if (["ITEM", "VOLUNTEER", "PROFESSIONAL"].includes(form.type))
    checks.push(["needs", "List what you need"]);
  const completed = checks.filter(([key]) => !allErrors[key]).length;
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
      if (submit) await navigate({ to: "/campaign/$id", params: { id: result.id } });
      else if (exit) await navigate({ to: "/manage" });
      else if (!draft)
        await navigate({ to: "/create", search: { draftId: result.id }, replace: true });
    },
  });
  useCreationSession(mutation.error);
  const busy = mutation.isPending || uploading;
  const submit = () => {
    setShowErrors(true);
    const missing = Object.keys(allErrors);
    if (missing.length) {
      focusError(missing[0]);
      return;
    }
    mutation.mutate({ submit: true, exit: false });
  };
  const preview = (
    <div className="overflow-hidden rounded-2xl border border-[#efedf3] bg-white shadow-sm">
      {form.coverImageUrl ? (
        <img
          src={form.coverImageUrl}
          alt="Campaign cover preview"
          className="aspect-[1.6] w-full object-cover"
        />
      ) : (
        <div className="grid aspect-[1.6] place-items-center bg-[#ebe7f2] text-sm text-[#777283]">
          Add your cover photo
        </div>
      )}
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-[#f2eff7] px-3 py-1">
            {form.mode === "ONGOING" ? "Ongoing support" : "One-time campaign"}
          </span>
          <span className="rounded-full bg-[#fff5db] px-3 py-1">Draft preview</span>
        </div>
        <h2 className="break-words text-xl font-semibold">{form.title || "Your campaign title"}</h2>
        <p className="text-xs text-[#777283]">
          {profile.data?.ownedOrganizations.find((org) => org.id === form.organizationId)?.name ||
            profile.data?.fullName ||
            "Your campaign"}
          {form.location && ` · ${form.location}`}
        </p>
        {form.mode === "ONGOING" ? (
          <p className="text-sm">
            {form.frequencies.map((frequency) => frequency.toLowerCase()).join(" · ") ||
              "Choose giving frequencies"}
          </p>
        ) : form.goalAmount ? (
          <p className="text-sm">
            Goal: {formatMoney(Number(form.goalAmount.replaceAll(",", "")))}
          </p>
        ) : null}
        <p className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words border-t pt-4 text-sm leading-relaxed">
          {form.story || "Your story will appear here as you write."}
        </p>
        {form.needs.length > 0 && (
          <ul className="space-y-2 text-sm">
            {form.needs.map((item) => (
              <li key={item} className="break-words">
                • {item}
              </li>
            ))}
          </ul>
        )}
        {form.galleryImageUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {form.galleryImageUrls.map((url) => (
              <img
                key={url}
                src={url}
                alt="Campaign gallery preview"
                className="aspect-square w-full rounded-lg object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
  const section = (title: string, subtitle: string) => (
    <div className="mb-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#777283]">{subtitle}</p>
    </div>
  );
  return (
    <div className="creation-layout dashboard-layout min-h-screen bg-white text-[#130e30]">
      <header className="sticky top-0 z-30 border-b border-[#efedf3] bg-white/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <span className="hidden sm:inline">
            <CreationLogo />
          </span>
          <Link to="/manage" className="text-sm">
            Manage
          </Link>
          <span className="rounded-full bg-[#f2eff7] px-3 py-1 text-xs">Draft</span>
          <span className="mr-auto text-xs text-[#777283]">
            {mutation.isPending ? "Saving..." : dirty || !savedId ? "Unsaved changes" : "Saved"}
          </span>
          <button
            type="button"
            className="giving-small-button lg:hidden"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye size={15} /> Preview
          </button>
          <button
            type="button"
            disabled={busy}
            className="giving-small-button"
            onClick={() => mutation.mutate({ submit: false, exit: false })}
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="rounded-full bg-[#130e30] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Submit for review
          </button>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] xl:grid-cols-[230px_minmax(0,1fr)_380px] lg:grid-cols-[minmax(0,1fr)_340px]">
        <aside className="hidden border-r border-[#efedf3] bg-[#faf9fc] p-5 xl:block">
          <div className="sticky top-28">
            <h2 className="mb-2 text-sm font-semibold">Ready for review</h2>
            <p className="mb-3 text-xs text-[#777283]">
              {completed}/{checks.length} requirements complete
            </p>
            <progress
              aria-label="Campaign completion"
              value={completed}
              max={checks.length}
              className="mb-5 h-2 w-full accent-[#130e30]"
            />
            <ul className="space-y-2">
              {checks.map(([key, label]) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => focusError(key)}
                    className="flex items-start gap-2 text-left text-xs leading-relaxed"
                  >
                    <span
                      className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${!allErrors[key] ? "border-[#130e30] bg-[#130e30] text-white" : "border-[#d8d5e0]"}`}
                    >
                      {!allErrors[key] && <Check size={11} />}
                    </span>
                    {label}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs leading-relaxed text-[#777283]">
              Saving a draft does not publish it. Submit when your details are complete.
            </p>
          </div>
        </aside>
        <main className="min-w-0 px-5 py-8 sm:px-8 xl:px-10">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">Create a campaign</h1>
            <p className="mt-2 text-sm text-[#777283]">
              A clear story. A real need. A way for people to help.
            </p>
          </div>
          {mutation.error && (
            <div role="alert" className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {mutation.error.message} Your details are still here.{" "}
              {mutation.error.message.toLowerCase().includes("payout") && (
                <Link to="/profile" hash="payouts" className="underline">
                  Check your payout settings
                </Link>
              )}
            </div>
          )}
          <fieldset disabled={busy} className="min-w-0 space-y-8">
            <div>
              {section(
                "Start with a template",
                "Templates set your campaign type, not your story. Existing details are kept.",
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {templates.map((template) => (
                  <button
                    type="button"
                    key={template.label}
                    onClick={() => change(template.fields as Partial<CampaignForm>)}
                    className="flex gap-3 rounded-xl border border-[#efedf3] p-4 text-left transition hover:border-[#130e30]"
                  >
                    <template.icon size={21} className="shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{template.label}</p>
                      <p className="mt-1 text-xs text-[#777283]">{template.line}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <section className="border-t border-[#efedf3] pt-8">
              {section("The basics", "Tell people what you are raising support for.")}
              <div className="space-y-5">
                <Field id="mode" label="Campaign mode" error={errors.mode}>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["ONE_TIME", "One-time"],
                      ["ONGOING", "Ongoing support"],
                    ].map(([mode, label]) => (
                      <button
                        type="button"
                        key={mode}
                        aria-pressed={form.mode === mode}
                        onClick={() => change({ mode: mode as CampaignForm["mode"] })}
                        className={`rounded-xl border p-3 text-sm ${form.mode === mode ? "border-[#130e30] bg-[#f4f0fa]" : "border-[#efedf3]"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field id="type" label="Kind of help" error={errors.type}>
                  <select
                    id="type"
                    className="giving-input"
                    value={form.type}
                    onChange={(event) =>
                      change({ type: event.target.value as CampaignForm["type"] })
                    }
                  >
                    <option value="">Choose a type</option>
                    {campaignTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="title" label="Campaign title" error={errors.title}>
                  <input
                    id="title"
                    className="giving-input"
                    value={form.title}
                    maxLength={150}
                    onChange={(event) => change({ title: event.target.value })}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="faithCategory" label="Cause category" error={errors.faithCategory}>
                    <select
                      id="faithCategory"
                      className="giving-input"
                      value={form.faithCategory}
                      onChange={(event) =>
                        change({
                          faithCategory: event.target.value as CampaignForm["faithCategory"],
                        })
                      }
                    >
                      <option value="">Choose a cause</option>
                      {faithCategoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field id="location" label="City and state" error={errors.location}>
                    <input
                      id="location"
                      className="giving-input"
                      value={form.location}
                      maxLength={160}
                      onChange={(event) => change({ location: event.target.value })}
                    />
                  </Field>
                </div>
                <Field id="urgency" label="Urgency">
                  <select
                    id="urgency"
                    className="giving-input"
                    value={form.urgency}
                    onChange={(event) =>
                      change({ urgency: event.target.value as CampaignForm["urgency"] })
                    }
                  >
                    {urgencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>
            <section className="border-t border-[#efedf3] pt-8">
              {section(
                "Tell your story",
                "Who you serve, what you need, what it costs, and how you will report back.",
              )}
              <Field
                id="story"
                label="Campaign story"
                error={errors.story}
                hint={`${countWords(form.story)} / 200 words. Write at least 100 words.`}
              >
                <textarea
                  id="story"
                  rows={10}
                  className="giving-input resize-y"
                  value={form.story}
                  aria-invalid={Boolean(errors.story)}
                  onChange={(event) => change({ story: event.target.value })}
                />
              </Field>
            </section>
            <section className="border-t border-[#efedf3] pt-8">
              {section("Support and goals", "Make it clear how people can help.")}
              <div className="space-y-5">
                {form.mode === "ONGOING" ? (
                  <Field
                    id="frequencies"
                    label="Available giving frequencies"
                    error={errors.frequencies}
                  >
                    <div className="flex flex-wrap gap-2">
                      {frequencyOptions.map((option) => (
                        <button
                          type="button"
                          key={option.value}
                          aria-pressed={form.frequencies.includes(option.value)}
                          className={`rounded-full border px-4 py-2 text-sm ${form.frequencies.includes(option.value) ? "border-[#130e30] bg-[#130e30] text-white" : "border-[#efedf3]"}`}
                          onClick={() =>
                            change({
                              frequencies: form.frequencies.includes(option.value)
                                ? form.frequencies.filter((value) => value !== option.value)
                                : [...form.frequencies, option.value],
                            })
                          }
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                ) : (
                  ["MONEY", "EMERGENCY"].includes(form.type) && (
                    <Field
                      id="goalAmount"
                      label={
                        form.type === "EMERGENCY"
                          ? "Goal amount (NGN, optional)"
                          : "Goal amount (NGN)"
                      }
                      error={errors.goalAmount}
                    >
                      <input
                        id="goalAmount"
                        className="giving-input"
                        inputMode="numeric"
                        value={form.goalAmount}
                        onChange={(event) =>
                          change({ goalAmount: formatAmountInput(event.target.value) })
                        }
                      />
                    </Field>
                  )
                )}
                {["ITEM", "VOLUNTEER", "PROFESSIONAL"].includes(form.type) && (
                  <Field
                    id="needs"
                    label={
                      form.type === "ITEM"
                        ? "Items needed"
                        : form.type === "VOLUNTEER"
                          ? "Volunteer roles"
                          : "Professional skills"
                    }
                    error={errors.needs || needError}
                  >
                    <div className="flex gap-2">
                      <input
                        id="needs"
                        className="giving-input min-w-0"
                        maxLength={200}
                        value={need}
                        onChange={(event) => setNeed(event.target.value)}
                        placeholder="Describe one item, role or skill"
                      />
                      <button
                        type="button"
                        className="giving-small-button shrink-0"
                        onClick={() => {
                          if (
                            !need.trim() ||
                            form.needs.includes(need.trim()) ||
                            form.needs.length >= 8
                          ) {
                            setNeedError("Add up to 8 different items, roles or skills.");
                            return;
                          }
                          change({ needs: [...form.needs, need.trim()] });
                          setNeed("");
                          setNeedError("");
                        }}
                      >
                        <Plus size={15} /> Add
                      </button>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {form.needs.map((item, index) => (
                        <li
                          key={item}
                          className="flex items-center justify-between gap-3 rounded-xl bg-[#f8f7fa] p-3 text-sm"
                        >
                          <span className="break-words">{item}</span>
                          <button
                            type="button"
                            aria-label={`Remove need ${index + 1}`}
                            onClick={() =>
                              change({ needs: form.needs.filter((value) => value !== item) })
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </Field>
                )}
              </div>
            </section>
            <section className="space-y-5 border-t border-[#efedf3] pt-8">
              {section("Photos", "Use real photos that help people understand your work.")}
              <div id="field-coverImageUrl">
                <MediaPicker
                  label="Cover photo"
                  folder="campaign-cover"
                  urls={form.coverImageUrl ? [form.coverImageUrl] : []}
                  limit={1}
                  onChange={(urls) => change({ coverImageUrl: urls[0] || "" })}
                  onBusy={setUploading}
                  error={errors.coverImageUrl}
                />
              </div>
              <div id="field-galleryImageUrls">
                <MediaPicker
                  label="Gallery photos"
                  folder="campaign-gallery"
                  urls={form.galleryImageUrls}
                  limit={8}
                  onChange={(galleryImageUrls) => change({ galleryImageUrls })}
                  onBusy={setUploading}
                  error={errors.galleryImageUrls}
                />
              </div>
            </section>
            <section className="border-t border-[#efedf3] pt-8">
              {section(
                "Organization",
                "Link an organization you own, or raise support in your own name.",
              )}
              {profile.isPending ? (
                <p className="text-sm">Loading your organizations...</p>
              ) : !profile.data || profile.isError ? (
                <LoadError
                  message="Could not load your organizations. Retry before choosing one."
                  retry={() => void profile.refetch()}
                />
              ) : (
                <Field
                  id="organizationId"
                  label="Organization (optional)"
                  error={errors.organizationId}
                >
                  <select
                    id="organizationId"
                    className="giving-input"
                    value={form.organizationId ?? ""}
                    onChange={(event) => change({ organizationId: event.target.value })}
                  >
                    <option value="">Standalone campaign</option>
                    {profile.data.ownedOrganizations.map((org) => (
                      <option
                        key={org.id}
                        value={org.id}
                        disabled={org.reviewAction === "rejected"}
                      >
                        {org.name} (
                        {org.reviewAction === "rejected"
                          ? "Rejected"
                          : org.verificationStatus.replaceAll("_", " ")}
                        )
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <div className="mt-5">
                <CreationNotice>
                  You need a saved payout account to submit. Your profile account can be used for
                  standalone and organization-linked campaigns.{" "}
                  <Link to="/profile" hash="payouts" className="font-medium underline">
                    Payout settings
                  </Link>
                </CreationNotice>
              </div>
            </section>
            <CreationNotice>
              Campaigns are reviewed before going live. A campaign linked to an organization is only
              available to donors when that organization is also approved.
            </CreationNotice>
            <div className="flex flex-wrap justify-between gap-3 border-t pt-6">
              <button
                type="button"
                onClick={() => mutation.mutate({ submit: false, exit: true })}
                className="giving-small-button"
              >
                Save and exit
              </button>
              <button
                type="button"
                onClick={submit}
                className="rounded-full bg-[#130e30] px-6 py-3 text-sm font-semibold text-white"
              >
                Submit for review
              </button>
            </div>
          </fieldset>
        </main>
        <aside className="hidden border-l border-[#efedf3] bg-[#faf9fc] px-5 py-8 lg:block">
          <div className="sticky top-28">
            <p className="mb-4 text-sm font-medium">Your campaign preview</p>
            {preview}
            <p className="mt-4 text-xs text-[#777283]">
              Preview only. No donations have been collected.
            </p>
          </div>
        </aside>
      </div>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogTitle>Your campaign preview</DialogTitle>
          <DialogDescription>Preview only. Save or submit from the editor.</DialogDescription>
          {preview}
        </DialogContent>
      </Dialog>
    </div>
  );
}
