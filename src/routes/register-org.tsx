import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Church, Globe, Baby, GraduationCap, Users, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { PageSpinner } from "@/components/PageSpinner";
import { LoadError } from "@/components/profile/SettingsParts";
import {
  ChoiceCard,
  FieldError,
  FlowTitle,
  Notice,
  Tag,
  cardClass,
  inputClass,
  labelClass,
} from "@/components/app/AppShell";
import { btnPrimary, btnSecondary } from "@/components/app/btn";
import { OnboardingShell } from "@/components/app/OnboardingShell";
import { Photo } from "@/components/app/Photo";
import { OrganizationUploads } from "@/components/creation/DesignMedia";
import { useCreationSession } from "@/components/creation/useCreationSession";
import {
  getOrganizationDraft,
  saveOrganizationDraft,
  submitOrganizationDraft,
  updateOrganizationDraft,
} from "@/features/catalog/api";
import type { Org } from "@/lib/catalog";
import {
  countWords,
  orgForm,
  organizationErrors,
  organizationPayload,
  normalizePublicLink,
  type OrgForm,
} from "@/lib/creation";

export const Route = createFileRoute("/register-org")({
  validateSearch: (s: Record<string, unknown>): { draftId?: string } => ({
    draftId: typeof s.draftId === "string" ? s.draftId : undefined,
  }),
  component: RegisterOrg,
});
const orgCategories = [
  { v: "church", icon: Church, label: "Church", desc: "Local congregation or church plant" },
  {
    v: "mission",
    icon: Globe,
    label: "Mission / Outreach",
    desc: "Missionaries or evangelism ministry",
  },
  { v: "orphanage", icon: Baby, label: "Orphanage", desc: "Faith-based care for children" },
  {
    v: "school",
    icon: GraduationCap,
    label: "School",
    desc: "Faith-based educational institution",
  },
  { v: "other", icon: Users, label: "Other ministry", desc: "Any other Christian ministry" },
] as const;

const stepFields = [
  ["name", "category", "otherCategoryLabel", "denomination", "foundedYear", "location"],
  ["tagline", "bio"],
  ["photoUrls", "registrationDocumentUrls", "externalLinks"],
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
    return (
      <div className="designer-app min-h-screen bg-panel">
        <PageSpinner label="Loading organization draft" />
      </div>
    );
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
  const savingLock = useRef(false);
  const [step, setStep] = useState(() => {
    if (!draft) return 0;
    const missing = organizationErrors(orgForm(draft));
    const firstIncomplete = stepFields.findIndex((keys) => keys.some((key) => missing[key]));
    return firstIncomplete === -1 ? 3 : firstIncomplete;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploads, setUploads] = useState(0);
  const onBusy = (uploading: boolean) => setUploads((n) => Math.max(0, n + (uploading ? 1 : -1)));
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
      savingLock.current = false;
      for (const key of ["organization-drafts", "profile", "organizations", "dashboard"])
        void queryClient.invalidateQueries({ queryKey: [key] });
      toast.success(submit ? "Organization submitted for review." : "Organization draft saved.");
      if (submit) await navigate({ to: "/org/$id", params: { id: result.id } });
      else if (exit) await navigate({ to: "/dashboard" });
      else if (!draft)
        await navigate({ to: "/register-org", search: { draftId: result.id }, replace: true });
    },
    onError: () => {
      savingLock.current = false;
    },
  });
  useCreationSession(mutation.error);
  const busy = mutation.isPending || uploads > 0;
  const steps = ["Details", "Mission", "Media", "Preview"];
  const validateStep = () => {
    if (busy) return;
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
    if (busy || savingLock.current) return;
    const all = organizationErrors(form);
    setErrors(all);
    if (Object.keys(all).length) {
      setStep(stepFields.findIndex((keys) => keys.some((key) => all[key])));
      return;
    }
    savingLock.current = true;
    mutation.mutate({ submit: true, exit: false });
  };

  const orgDraft = {
    name: form.name,
    category: form.category.toLowerCase(),
    denomination: form.denomination,
    location: form.location,
    founded: form.foundedYear,
    tagline: form.tagline,
    bio: form.bio,
    photos: form.photoUrls,
  };
  const setOrgDraft = (patch: Partial<typeof orgDraft>) =>
    setForm((current) => ({
      ...current,
      ...("name" in patch ? { name: patch.name ?? "" } : {}),
      ...("category" in patch
        ? { category: patch.category?.toUpperCase() as OrgForm["category"] }
        : {}),
      ...("denomination" in patch ? { denomination: patch.denomination ?? "" } : {}),
      ...("location" in patch ? { location: patch.location ?? "" } : {}),
      ...("founded" in patch ? { foundedYear: patch.founded ?? "" } : {}),
      ...("tagline" in patch ? { tagline: patch.tagline ?? "" } : {}),
      ...("bio" in patch ? { bio: patch.bio ?? "" } : {}),
    }));
  const field = (key: string) =>
    errors[key] ? (
      <FieldError>
        <span role="alert">{errors[key]}</span>
      </FieldError>
    ) : null;
  const selectedCategory = orgCategories.find((c) => c.v === orgDraft.category);
  const addLink = () => {
    const normalized = normalizePublicLink(link);
    if (!normalized) {
      setLinkError("Enter a valid website or social link, such as www.example.com.");
      return;
    }
    if (
      form.externalLinks.length >= 10 ||
      form.externalLinks.some((item) => normalizePublicLink(item) === normalized)
    ) {
      setLinkError("Add up to 10 different links.");
      return;
    }
    setForm((f) => ({ ...f, externalLinks: [...f.externalLinks, normalized] }));
    setLink("");
    setLinkError("");
  };
  const preview = (
    <div className={`${cardClass} flex flex-col gap-4 overflow-hidden`}>
      {form.photoUrls[0] ? (
        <Photo
          src={form.photoUrls[0]}
          alt="Organization cover preview"
          className="h-[170px] w-full"
        />
      ) : (
        <div className="grid h-[170px] w-full place-items-center bg-panel text-muted-ink">
          <ImagePlus className="h-8 w-8" strokeWidth={1.5} />
        </div>
      )}
      <div className="flex flex-col gap-3 px-5 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Tag>{selectedCategory?.label ?? "Category"}</Tag>
          <Tag>Unverified</Tag>
        </div>
        <p className="font-display text-[22px] leading-[1.2] text-ink">
          {orgDraft.name || "Your organization"}
        </p>
        <p className="text-sm leading-5 text-muted-ink">
          {orgDraft.tagline || "Your one-line tagline appears here."}
        </p>
        <p className="text-[13px] text-muted-ink">
          {[
            orgDraft.denomination,
            orgDraft.location,
            orgDraft.founded && `Since ${orgDraft.founded}`,
          ]
            .filter(Boolean)
            .join(", ") || "Denomination, location, founded"}
        </p>
        {orgDraft.bio ? (
          <p className="line-clamp-4 border-t border-line-soft pt-3 text-sm leading-[21px] text-ink-soft">
            {orgDraft.bio}
          </p>
        ) : null}
      </div>
    </div>
  );

  return (
    <OnboardingShell
      steps={steps}
      current={step}
      busy={busy}
      onExit={() => {
        if (busy || savingLock.current) return;
        if (link.trim()) {
          setLinkError("Add this link or clear the field before saving and exiting.");
          return;
        }
        savingLock.current = true;
        mutation.mutate({ submit: false, exit: true });
      }}
      exitLabel={mutation.isPending ? "Saving..." : "Save and exit"}
      previewLabel="Your public profile"
      preview={preview}
      footer={
        <>
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={busy}
              className={btnSecondary}
            >
              Back
            </button>
          ) : (
            <span />
          )}
          {step < steps.length - 1 ? (
            <button type="button" onClick={validateStep} disabled={busy} className={btnPrimary}>
              Continue
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={busy} className={btnPrimary}>
              {mutation.isPending ? "Submitting..." : "Submit for review"}
            </button>
          )}
        </>
      }
    >
      <fieldset disabled={busy} className="contents">
        <div className="flex min-w-0 flex-col gap-10">
          {step === 0 ? (
            <div className="flex flex-col gap-6">
              <StepTitle
                title="Tell us about your org"
                sub="The basics givers will see on your profile."
              />
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Organization name</span>
                <input
                  maxLength={120}
                  className={inputClass}
                  placeholder="e.g. Grace Harvest Orphanage"
                  value={orgDraft.name ?? ""}
                  onChange={(e) => setOrgDraft({ name: e.target.value })}
                />
                {field("name")}
              </label>

              <fieldset className="flex flex-col gap-2">
                <legend className={`${labelClass} pb-2`}>Category</legend>
                <div className="grid gap-3">
                  {orgCategories.map(({ v, icon: Icon, label, desc }) => (
                    <ChoiceCard
                      key={v}
                      selected={orgDraft.category === v}
                      onClick={() => setOrgDraft({ category: v })}
                      icon={<Icon className="h-5 w-5" strokeWidth={1.5} />}
                      title={label}
                      description={desc}
                    />
                  ))}
                </div>
                {field("category")}
              </fieldset>

              {form.category === "OTHER" && (
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Specify ministry type</span>
                  <input
                    className={inputClass}
                    maxLength={120}
                    value={form.otherCategoryLabel ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, otherCategoryLabel: e.target.value }))}
                  />
                  {field("otherCategoryLabel")}
                </label>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Denomination or tradition</span>
                  <input
                    className={inputClass}
                    placeholder="e.g. ECWA, Baptist, Pentecostal"
                    value={orgDraft.denomination ?? ""}
                    onChange={(e) => setOrgDraft({ denomination: e.target.value })}
                  />
                  {field("denomination")}
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Year founded</span>
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    placeholder="e.g. 2008"
                    value={orgDraft.founded ?? ""}
                    onChange={(e) =>
                      setOrgDraft({ founded: e.target.value.replace(/\D/g, "").slice(0, 4) })
                    }
                  />
                  {field("foundedYear")}
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Location</span>
                <input
                  className={inputClass}
                  placeholder="e.g. Jos, Plateau State"
                  value={orgDraft.location ?? ""}
                  onChange={(e) => setOrgDraft({ location: e.target.value })}
                />
                {field("location")}
              </label>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="flex flex-col gap-6">
              <StepTitle
                title="Your mission"
                sub="Help givers understand who you are and what you do."
              />
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>
                  Tagline <span className="font-normal text-muted-ink">(one sentence)</span>
                </span>
                <input
                  className={inputClass}
                  placeholder="e.g. Every Sunday, under the bridge, for the forgotten"
                  value={orgDraft.tagline ?? ""}
                  onChange={(e) => setOrgDraft({ tagline: e.target.value })}
                />
                {field("tagline")}
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>About your org</span>
                <textarea
                  aria-label="About your org"
                  rows={7}
                  className={`${inputClass} resize-none`}
                  placeholder="Who you are, who you serve, and why it matters. Real stories and numbers build trust."
                  value={orgDraft.bio ?? ""}
                  onChange={(e) => setOrgDraft({ bio: e.target.value })}
                />
                <span className="flex items-center justify-between">
                  {field("bio") ?? <span />}
                  <span className="text-[13px] text-muted-ink">
                    {countWords(form.bio)} / 200 words. At least 100 words.
                  </span>
                </span>
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="flex flex-col gap-6">
              <StepTitle
                title="Add photos, links and proof"
                sub="Show givers the work. Nothing builds trust faster."
              />
              <OrganizationUploads
                folder="organization-photo"
                urls={form.photoUrls}
                limit={8}
                disabled={busy}
                onChange={(photoUrls) => setForm((f) => ({ ...f, photoUrls }))}
                onBusy={onBusy}
                error={errors.photoUrls}
              />
              <OrganizationUploads
                documents
                folder="organization-document"
                urls={form.registrationDocumentUrls}
                limit={5}
                disabled={busy}
                onChange={(registrationDocumentUrls) =>
                  setForm((f) => ({ ...f, registrationDocumentUrls }))
                }
                onBusy={onBusy}
                error={errors.registrationDocumentUrls}
              />
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>
                  Relevant public links{" "}
                  <span className="font-normal text-muted-ink">(optional)</span>
                </span>
                <div className="flex gap-2">
                  <input
                    className={inputClass}
                    placeholder="www.your-website.com"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={link}
                    onChange={(e) => {
                      setLink(e.target.value);
                      setLinkError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addLink();
                      }
                    }}
                  />
                  <button type="button" className={btnSecondary} onClick={addLink}>
                    Add link
                  </button>
                </div>
                {(linkError || errors.externalLinks) && (
                  <FieldError>
                    <span role="alert">{linkError || errors.externalLinks}</span>
                  </FieldError>
                )}
                <span className="text-[13px] text-muted-ink">
                  Website and social links are welcome. We add https:// if you leave it out.
                </span>
              </label>
              {form.externalLinks.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {form.externalLinks.map((url, i) => (
                    <li
                      key={url}
                      className="flex items-center justify-between gap-3 rounded-field bg-panel px-3.5 py-2.5 text-sm text-ink-soft"
                    >
                      <span className="min-w-0 break-all">{url}</span>
                      <button
                        type="button"
                        aria-label={"Remove link " + (i + 1)}
                        className="shrink-0 underline"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            externalLinks: f.externalLinks.filter((_, j) => j !== i),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="flex flex-col gap-6">
              <StepTitle
                title="Review before publishing"
                sub="Check your details before sending them to our team for verification."
              />
              <div className="lg:hidden">{preview}</div>
              <Notice>
                Your profile is submitted for admin review. Only approved organizations are publicly
                discoverable. We will notify you when the review is updated.
              </Notice>
              <details className="rounded-field border border-line-soft p-4">
                <summary className="cursor-pointer text-sm font-medium text-ink">
                  Full registration details
                </summary>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                  {form.bio}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {form.photoUrls.map((url) => (
                    <Photo
                      key={url}
                      src={url}
                      alt="Organization gallery preview"
                      className="aspect-square rounded-field"
                    />
                  ))}
                </div>
                <p className="mt-3 text-sm text-muted-ink">
                  {form.registrationDocumentUrls.length} private verification documents
                </p>
                {form.externalLinks.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block break-all text-sm underline"
                  >
                    {url}
                  </a>
                ))}
              </details>
            </div>
          ) : null}
        </div>
      </fieldset>
      {mutation.error && (
        <p role="alert" className="mt-4 rounded-field bg-panel p-4 text-sm text-danger">
          {mutation.error.message} Your details are still here.
        </p>
      )}
    </OnboardingShell>
  );
}

function StepTitle({ title, sub }: { title: string; sub: string }) {
  return <FlowTitle title={title} sub={sub} />;
}
