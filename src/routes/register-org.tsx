import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Church, Globe, Baby, GraduationCap, Users, X } from "lucide-react";
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
import {
  getOrganizationDraft,
  saveOrganizationDraft,
  submitOrganizationDraft,
  updateOrganizationDraft,
} from "@/features/catalog/api";
import { orgCategoryOptions, type Org } from "@/lib/catalog";
import {
  countWords,
  orgForm,
  organizationErrors,
  organizationPayload,
  publicLink,
} from "@/lib/creation";

export const Route = createFileRoute("/register-org")({
  validateSearch: (search: Record<string, unknown>): { draftId?: string } => ({
    draftId: typeof search.draftId === "string" ? search.draftId : undefined,
  }),
  component: RegisterOrg,
});
const icons = {
  CHURCH: Church,
  MISSION: Globe,
  ORPHANAGE: Baby,
  SCHOOL: GraduationCap,
  OTHER: Users,
};
const stepFields = [
  ["name", "category", "otherCategoryLabel", "denomination", "foundedYear", "location"],
  ["tagline", "bio"],
  ["photoUrls", "registrationDocumentUrls"],
];
function RegisterOrg() {
  const { draftId } = Route.useSearch();
  const { ready, userId } = useCreationSession();
  const draft = useQuery({
    queryKey: ["organization-draft", userId, draftId],
    queryFn: () => getOrganizationDraft(draftId!),
    enabled: ready && Boolean(draftId),
  });
  useCreationSession(draft.error);
  if (!ready || (draftId && draft.isPending))
    return <PageSpinner label="Loading organization draft" />;
  if (draftId && !draft.data)
    return (
      <div className="mx-auto max-w-xl p-8">
        <LoadError
          message="Could not load this organization draft. Nothing has been overwritten."
          retry={() => void draft.refetch()}
        />
      </div>
    );
  return (
    <OrganizationEditor
      key={`${userId}:${draftId ?? "new"}`}
      draft={draftId ? draft.data : undefined}
      userId={userId!}
    />
  );
}
function OrganizationEditor({ draft, userId }: { draft?: Org; userId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => orgForm(draft));
  const [savedId, setSavedId] = useState(draft?.id);
  const [step, setStep] = useState(() => {
    if (!draft) return 0;
    const missing = organizationErrors(orgForm(draft));
    const firstIncomplete = stepFields.findIndex((keys) => keys.some((key) => missing[key]));
    return firstIncomplete === -1 ? 3 : firstIncomplete;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const mutation = useMutation({
    mutationFn: async ({ submit, exit }: { submit: boolean; exit: boolean }) => {
      const payload = organizationPayload(form);
      const saved = savedId
        ? await updateOrganizationDraft(savedId, payload)
        : await saveOrganizationDraft(payload);
      setSavedId(saved.id);
      queryClient.setQueryData(["organization-draft", userId, saved.id], saved);
      const result = submit ? await submitOrganizationDraft(saved.id) : saved;
      return { result, submit, exit };
    },
    onSuccess: async ({ result, submit, exit }) => {
      for (const key of ["organization-drafts", "profile", "organizations", "dashboard"])
        void queryClient.invalidateQueries({ queryKey: [key] });
      toast.success(submit ? "Organization submitted for review." : "Organization draft saved.");
      if (submit) await navigate({ to: "/org/$id", params: { id: result.id } });
      else if (exit) await navigate({ to: "/manage" });
      else if (!draft)
        await navigate({ to: "/register-org", search: { draftId: result.id }, replace: true });
    },
  });
  useCreationSession(mutation.error);
  const busy = mutation.isPending || uploading;
  const steps = ["Details", "Mission", "Media", "Review"];
  const validateStep = () => {
    if (step === 2 && link.trim()) {
      setLinkError("Add this link or clear the field before continuing.");
      return;
    }
    const all = organizationErrors(form);
    const relevant = Object.fromEntries(
      Object.entries(all).filter(([key]) => stepFields[step]?.includes(key)),
    );
    setErrors(relevant);
    if (Object.keys(relevant).length) return;
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const submit = () => {
    const all = organizationErrors(form);
    setErrors(all);
    if (Object.keys(all).length) {
      setStep(stepFields.findIndex((keys) => keys.some((key) => all[key])));
      return;
    }
    mutation.mutate({ submit: true, exit: false });
  };
  const field = (
    key: "name" | "otherCategoryLabel" | "denomination" | "location" | "tagline",
    label: string,
    maxLength: number,
  ) => (
    <Field id={key} label={label} error={errors[key]}>
      <input
        id={key}
        className="giving-input"
        maxLength={maxLength}
        value={form[key]}
        aria-invalid={Boolean(errors[key])}
        onChange={(event) => setForm({ ...form, [key]: event.target.value })}
      />
    </Field>
  );
  const preview = (
    <div className="overflow-hidden rounded-2xl border border-[#efedf3] bg-white shadow-sm">
      {form.photoUrls[0] ? (
        <img
          src={form.photoUrls[0]}
          alt="Organization cover preview"
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="grid h-44 place-items-center bg-[#eeeaf4] text-sm text-[#777283]">
          Your cover photo appears here
        </div>
      )}
      <div className="space-y-3 p-6">
        <span className="rounded-full bg-[#f0ecf8] px-3 py-1 text-xs">
          {form.category === "OTHER"
            ? form.otherCategoryLabel || "Other ministry"
            : form.category.toLowerCase() || "Category"}
        </span>
        <h2 className="break-words text-xl font-semibold">{form.name || "Your organization"}</h2>
        <p className="break-words text-sm text-[#777283]">
          {form.tagline || "Your mission in one line"}
        </p>
        <p className="text-xs text-[#777283]">
          {[form.location, form.denomination, form.foundedYear && `Founded ${form.foundedYear}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="line-clamp-5 whitespace-pre-wrap break-words border-t pt-3 text-sm leading-relaxed">
          {form.bio}
        </p>
      </div>
    </div>
  );
  return (
    <div className="creation-layout dashboard-layout min-h-screen bg-[#f6f5f8] text-[#130e30]">
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-8">
        <CreationLogo />
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm"
          disabled={busy}
          onClick={() => mutation.mutate({ submit: false, exit: true })}
        >
          Save and exit <X size={16} />
        </button>
      </header>
      <main className="mx-auto grid max-w-[1120px] overflow-hidden rounded-2xl bg-white shadow-[0_32px_80px_-32px_rgba(19,14,48,0.2)] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
        <div className="min-w-0">
          <div className="px-6 pt-7 sm:px-10">
            <ol aria-label="Registration progress" className="mb-3 flex gap-2">
              {steps.map((label, index) => (
                <li
                  key={label}
                  aria-current={index === step ? "step" : undefined}
                  title={label}
                  className={`h-1.5 rounded-full ${index === step ? "w-9 bg-[#130e30]" : index < step ? "w-5 bg-[#777283]" : "w-5 bg-[#e5e1ee]"}`}
                />
              ))}
            </ol>
            <p className="text-sm text-[#777283]">
              Step {step + 1} of 4:{" "}
              <span className="font-medium text-[#130e30]">{steps[step]}</span>
            </p>
          </div>
          <fieldset disabled={busy} className="min-w-0 space-y-6 px-6 py-7 sm:px-10">
            {draft && (
              <CreationNotice>
                Editing your saved draft. Changes stay here until you save or submit.
              </CreationNotice>
            )}
            {step === 0 && (
              <>
                <div>
                  <h1 className="text-2xl font-semibold">Tell us about your organization</h1>
                  <p className="mt-2 text-sm text-[#777283]">
                    The basics people will see on your profile.
                  </p>
                </div>
                {field("name", "Organization name", 120)}
                <Field id="category" label="Category" error={errors.category}>
                  <div className="grid gap-2">
                    {orgCategoryOptions.map((option) => {
                      const Icon = icons[option.value];
                      return (
                        <button
                          type="button"
                          aria-pressed={form.category === option.value}
                          key={option.value}
                          onClick={() => setForm({ ...form, category: option.value })}
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm ${form.category === option.value ? "border-[#130e30] bg-[#f4f0fa]" : "border-[#efedf3]"}`}
                        >
                          <Icon size={19} />
                          {option.label}
                          {form.category === option.value && (
                            <Check size={16} className="ml-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                {form.category === "OTHER" &&
                  field("otherCategoryLabel", "Specify ministry type", 120)}
                <div className="grid gap-4 sm:grid-cols-2">
                  {field("denomination", "Denomination / tradition", 120)}
                  <Field id="foundedYear" label="Year founded" error={errors.foundedYear}>
                    <input
                      id="foundedYear"
                      className="giving-input"
                      inputMode="numeric"
                      value={form.foundedYear}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          foundedYear: event.target.value.replace(/\D/g, "").slice(0, 4),
                        })
                      }
                    />
                  </Field>
                </div>
                {field("location", "City and state", 160)}
              </>
            )}
            {step === 1 && (
              <>
                <div>
                  <h1 className="text-2xl font-semibold">Your mission</h1>
                  <p className="mt-2 text-sm text-[#777283]">
                    Help people understand who you are and what you do.
                  </p>
                </div>
                {field("tagline", "Tagline", 200)}
                <Field
                  id="bio"
                  label="About your organization"
                  error={errors.bio}
                  hint={`${countWords(form.bio)} / 200 words. Write at least 100 words.`}
                >
                  <textarea
                    id="bio"
                    rows={9}
                    className="giving-input resize-y"
                    aria-invalid={Boolean(errors.bio)}
                    value={form.bio}
                    onChange={(event) => setForm({ ...form, bio: event.target.value })}
                  />
                </Field>
              </>
            )}
            {step === 2 && (
              <>
                <div>
                  <h1 className="text-2xl font-semibold">Photos, links and proof</h1>
                  <p className="mt-2 text-sm text-[#777283]">
                    Show your work. Verification documents are only shared with the review team.
                  </p>
                </div>
                <MediaPicker
                  label="Organization photos"
                  folder="organization-photo"
                  urls={form.photoUrls}
                  limit={8}
                  onChange={(photoUrls) => setForm((current) => ({ ...current, photoUrls }))}
                  onBusy={setUploading}
                  error={errors.photoUrls}
                />
                <MediaPicker
                  label="Registration evidence"
                  folder="organization-document"
                  urls={form.registrationDocumentUrls}
                  limit={5}
                  onChange={(registrationDocumentUrls) =>
                    setForm((current) => ({ ...current, registrationDocumentUrls }))
                  }
                  onBusy={setUploading}
                  error={errors.registrationDocumentUrls}
                />
                <p className="text-xs text-[#777283]">
                  Upload a CAC registration document or a recommendation letter from a recognized
                  parent ministry.
                </p>
                <Field id="publicLink" label="Relevant public links" error={linkError}>
                  <div className="flex gap-2">
                    <input
                      id="publicLink"
                      className="giving-input min-w-0"
                      placeholder="https://your-website.com"
                      value={link}
                      onChange={(event) => setLink(event.target.value)}
                    />
                    <button
                      type="button"
                      className="giving-small-button shrink-0"
                      onClick={() => {
                        if (!publicLink(link)) {
                          setLinkError(
                            "Paste a valid website or social URL starting with https:// or http://.",
                          );
                          return;
                        }
                        if (
                          form.externalLinks.length >= 10 ||
                          form.externalLinks.includes(link.trim())
                        ) {
                          setLinkError("Add up to 10 different links.");
                          return;
                        }
                        setForm({ ...form, externalLinks: [...form.externalLinks, link.trim()] });
                        setLink("");
                        setLinkError("");
                      }}
                    >
                      Add link
                    </button>
                  </div>
                </Field>
                {form.externalLinks.map((url, index) => (
                  <div
                    key={url}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-[#f8f7fa] p-3 text-xs"
                  >
                    <span className="break-all">{url}</span>
                    <button
                      type="button"
                      aria-label={`Remove link ${index + 1}`}
                      onClick={() =>
                        setForm({
                          ...form,
                          externalLinks: form.externalLinks.filter((item) => item !== url),
                        })
                      }
                      className="shrink-0 underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </>
            )}
            {step === 3 && (
              <>
                <h1 className="text-2xl font-semibold">Ready for review?</h1>
                {preview}
                <div className="space-y-3 border-t pt-4">
                  <h2 className="text-sm font-semibold">Full mission</h2>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {form.bio}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {form.photoUrls.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt="Organization gallery preview"
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p>{form.photoUrls.length} photos</p>
                  <p>{form.registrationDocumentUrls.length} private verification documents</p>
                  {form.externalLinks.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="block break-all underline"
                    >
                      {url}
                    </a>
                  ))}
                </div>
                <CreationNotice>
                  Your organization will be pending review after submission. Only approved
                  organizations can be discovered and supported publicly.
                </CreationNotice>
              </>
            )}
          </fieldset>
          {mutation.error && (
            <p
              role="alert"
              className="mx-6 mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 sm:mx-10"
            >
              {mutation.error.message} Your details are still here.
            </p>
          )}
          <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t bg-white px-6 py-4 sm:px-10">
            <button
              type="button"
              disabled={busy || step === 0}
              onClick={() => setStep(step - 1)}
              className="giving-small-button"
            >
              Back
            </button>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                className="giving-small-button"
                onClick={() => mutation.mutate({ submit: false, exit: false })}
              >
                {mutation.isPending ? "Saving..." : "Save draft"}
              </button>
              <button
                type="button"
                disabled={busy}
                className="rounded-full bg-[#130e30] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                onClick={step === 3 ? submit : validateStep}
              >
                {step === 3 ? "Submit for review" : "Continue"}
              </button>
            </div>
          </div>
        </div>
        <aside className="hidden bg-[radial-gradient(ellipse_at_top,#ddd6ed,#edeaf3_60%,#f6f5f8)] p-10 lg:block">
          <div className="sticky top-12">
            <p className="mb-4 text-sm font-medium">Your public profile</p>
            {preview}
            <p className="mt-4 text-xs leading-relaxed text-[#777283]">
              Preview only. Nothing is public until your organization has been approved.
            </p>
          </div>
        </aside>
      </main>
      <div className="h-10" />
    </div>
  );
}
