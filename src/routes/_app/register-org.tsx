import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useApp } from "@/lib/store";
import { RequireUser } from "@/components/auth/RequireUser";
import { OnboardingShell } from "@/components/app/OnboardingShell";
import { toast } from "sonner";
import { Church, Globe, Baby, GraduationCap, Users, ImagePlus, FileText, Trash2, ChevronDown } from "lucide-react";
import type { Org } from "@/lib/domain";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/register-org")({
  validateSearch: (search: Record<string, unknown>): { draft?: string } => ({
    draft: typeof search.draft === "string" && search.draft ? search.draft : undefined,
  }),
  head: () => ({ meta: [{ title: "Register your org — AzarFaith" }] }),
  component: ProtectedRegisterOrg,
});

function ProtectedRegisterOrg() {
  return <RequireUser><RegisterOrg /></RequireUser>;
}

const denominationOptions = [
  "Anglican",
  "Baptist",
  "Catholic",
  "ECWA",
  "Methodist",
  "Pentecostal",
  "Presbyterian",
  "RCCG",
  "Seventh-day Adventist",
  "Non-denominational",
  "Interdenominational",
] as const;
const otherDenominationValue = "__other__";
type OrganizationDraftDetail = Org & {
  otherCategoryLabel?: string;
  links?: string[];
  registrationDocuments?: string[];
};

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

function RegisterOrg() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const { orgDraft, setOrgDraft, resetOrgDraft } = useApp();
  const hydratedDraftId = useRef<string | null>(null);
  const draftQuery = useQuery({
    queryKey: ["organization-draft", search.draft],
    queryFn: () => apiFetch<OrganizationDraftDetail>(`/organizations/drafts/${search.draft}`),
    enabled: Boolean(search.draft),
  });
  useEffect(() => {
    if (search.draft) return;
    resetOrgDraft();
    setDraftId(null);
    hydratedDraftId.current = null;
  }, [search.draft, resetOrgDraft]);
  useEffect(() => {
    if (!search.draft || !draftQuery.data || hydratedDraftId.current === search.draft) return;
    const saved = draftQuery.data;
    resetOrgDraft();
    setOrgDraft({
      name: saved.name,
      tagline: saved.tagline,
      category: saved.category,
      otherCategoryLabel: saved.otherCategoryLabel,
      denomination: saved.denomination,
      location: saved.location,
      founded: saved.founded,
      bio: saved.bio,
      photos: saved.photos,
      videos: saved.links ?? [],
      registrationDocuments: saved.registrationDocuments ?? [],
    });
    setDraftId(saved.id);
    hydratedDraftId.current = saved.id;
  }, [search.draft, draftQuery.data, resetOrgDraft, setOrgDraft]);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(search.draft ?? null);
  const [uploading, setUploading] = useState(false);
  const [otherDenominationSelected, setOtherDenominationSelected] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const documentInput = useRef<HTMLInputElement>(null);

  const steps = ["Details", "Mission", "Media", "Preview"];
  const denomination = orgDraft.denomination ?? "";
  const isKnownDenomination = denominationOptions.some((option) => option === denomination);
  const isOtherDenomination = otherDenominationSelected || Boolean(denomination && !isKnownDenomination);
  const denominationSelection = isOtherDenomination ? otherDenominationValue : denomination;

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!orgDraft.name?.trim()) e.name = "Organization name is required";
      if (!orgDraft.category) e.category = "Select a category";
      if (!orgDraft.denomination?.trim()) e.denomination = "Denomination or tradition is required";
      if (orgDraft.category === "other" && !orgDraft.otherCategoryLabel?.trim()) e.otherCategoryLabel = "Describe the kind of ministry";
      if (!orgDraft.location?.trim()) e.location = "Location is required";
    }
    if (step === 1) {
      if (!orgDraft.tagline?.trim() || orgDraft.tagline.length < 10)
        e.tagline = "Add a short tagline (at least 10 characters)";
      const words = orgDraft.bio?.trim().split(/\s+/).filter(Boolean).length ?? 0;
      if (words < 100 || words > 200) e.bio = "Use between 100 and 200 words";
    }
    if (step === 2) {
      if ((orgDraft.photos?.length ?? 0) < 3) e.photos = "Upload at least 3 photos of your organization or work";
      if ((orgDraft.registrationDocuments?.length ?? 0) === 0) e.documents = "Upload a CAC registration document or recommendation letter";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate()) return;
    setStep((s) => s + 1);
  };

  const payload = () => ({
    name: orgDraft.name?.trim(), tagline: orgDraft.tagline?.trim(), category: orgDraft.category?.toUpperCase(),
    otherCategoryLabel: orgDraft.otherCategoryLabel?.trim() || undefined,
    denomination: orgDraft.denomination?.trim(), location: orgDraft.location?.trim(),
    foundedYear: orgDraft.founded ? Number(orgDraft.founded) : undefined, bio: orgDraft.bio?.trim(),
    ...(orgDraft.photos?.length ? { photoUrls: orgDraft.photos } : {}),
    ...(orgDraft.videos?.length ? { externalLinks: orgDraft.videos } : {}),
    ...(orgDraft.registrationDocuments?.length ? { registrationDocumentUrls: orgDraft.registrationDocuments } : {}),
  });

  const uploadFiles = async (files: FileList | null, folder: "organization-photo" | "organization-document") => {
    if (!files?.length) return;
    const selected = Array.from(files);
    const isPhoto = folder === "organization-photo";
    const current = useApp.getState().orgDraft;
    const available = isPhoto ? 8 - (current.photos?.length ?? 0) : 5 - (current.registrationDocuments?.length ?? 0);
    if (selected.length > available) {
      toast.error(`You can add ${available} more ${isPhoto ? "photo" : "document"}${available === 1 ? "" : "s"}.`);
      return;
    }
    const allowed = isPhoto
      ? ["image/jpeg", "image/png", "image/webp"]
      : ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (selected.some((file) => !allowed.includes(file.type))) {
      toast.error(isPhoto ? "Choose JPEG, PNG or WebP images." : "Choose PDF, JPEG, PNG or WebP files.");
      return;
    }
    if (selected.some((file) => file.size > 5 * 1024 * 1024)) {
      toast.error("Each upload must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const results = await Promise.allSettled(selected.map(async (file) => {
        const body = new FormData();
        body.append("file", file);
        body.append("folder", folder);
        return apiFetch<{ url: string }>("/media/upload", { method: "POST", body });
      }));
      const urls = results.flatMap((result) => result.status === "fulfilled" ? [result.value.url] : []);
      if (urls.length) {
        const latest = useApp.getState().orgDraft;
        if (isPhoto) setOrgDraft({ photos: [...(latest.photos ?? []), ...urls].slice(0, 8) });
        else setOrgDraft({ registrationDocuments: [...(latest.registrationDocuments ?? []), ...urls].slice(0, 5) });
        toast.success(`${urls.length} file${urls.length === 1 ? "" : "s"} uploaded`);
      }
      const failed = results.filter((result) => result.status === "rejected");
      if (failed.length) toast.error(`${failed.length} file${failed.length === 1 ? "" : "s"} could not be uploaded. Try again.`);
    } finally {
      setUploading(false);
    }
  };

  const saveDraft = async (): Promise<boolean> => {
    const value = payload();
    if (!Object.values(value).some((item) => Array.isArray(item) ? item.length > 0 : Boolean(item))) return true;
    try {
      const saved = await apiFetch<{ id: string }>(draftId ? `/organizations/${draftId}/draft` : "/organizations/drafts", {
        method: draftId ? "PATCH" : "POST", body: JSON.stringify(value),
      });
      setDraftId(saved.id);
      await queryClient.invalidateQueries({ queryKey: ["organization-drafts"], refetchType: "all" });
      toast.success("Draft saved. Continue it from Manage.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your draft.");
      return false;
    }
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (draftId) {
        await apiFetch(`/organizations/${draftId}/draft`, {
          method: "PATCH", body: JSON.stringify(payload()),
        });
      }
      await apiFetch<Org>(draftId ? `/organizations/${draftId}/submit` : "/organizations", {
        method: "POST", body: draftId ? undefined : JSON.stringify(payload()),
      });
      resetOrgDraft();
      void queryClient.invalidateQueries({ queryKey: ["organization-drafts"] });
      void queryClient.invalidateQueries({ queryKey: ["my-dashboard"] });
      toast("Your organization has been submitted for review.");
      nav({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your organization.");
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key: keyof typeof errors) =>
    errors[key] ? <FieldError>{errors[key]}</FieldError> : null;
  const selectedCategory = orgCategories.find((c) => c.v === orgDraft.category);

  const preview = (
    <div className={`${cardClass} flex flex-col gap-4 overflow-hidden`}>
      {orgDraft.photos?.[0] ? <img src={orgDraft.photos[0]} alt="" className="h-[170px] w-full object-cover" /> : <div className="grid h-[170px] w-full place-items-center bg-panel text-muted-ink"><ImagePlus className="h-8 w-8" strokeWidth={1.5} /></div>}
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

  if (draftQuery.error) throw draftQuery.error;
  if (search.draft && (draftQuery.isLoading || hydratedDraftId.current !== search.draft)) {
    return <div className="grid min-h-screen place-items-center bg-panel text-sm text-muted-ink" aria-busy="true">Loading organization draft…</div>;
  }

  return (
    <OnboardingShell
      steps={steps}
      current={step}
      exitTo="/dashboard"
      onExit={saveDraft}
      previewLabel="Your public profile"
      preview={preview}
      footer={
        <>
          {step > 0 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)} className={btnSecondary}>
              Back
            </button>
          ) : (
            <span />
          )}
          {step < steps.length - 1 ? (
            <button type="button" onClick={next} className={btnPrimary}>
              Continue
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={submitting} className={btnPrimary}>
              {submitting ? "Publishing…" : "Publish profile"}
            </button>
          )}
        </>
      }
    >
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

            {orgDraft.category === "other" ? (
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>What kind of ministry is this?</span>
                <input className={inputClass} placeholder="e.g. Prison ministry" value={orgDraft.otherCategoryLabel ?? ""} onChange={(e) => setOrgDraft({ otherCategoryLabel: e.target.value })} />
                {field("otherCategoryLabel")}
              </label>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Denomination or tradition</span>
                  <span className="relative">
                    <select
                      value={denominationSelection}
                      onChange={(event) => {
                        const selection = event.target.value;
                        setOtherDenominationSelected(selection === otherDenominationValue);
                        setOrgDraft({ denomination: selection === otherDenominationValue ? "" : selection });
                      }}
                      className={cn(inputClass, "cursor-pointer appearance-none pr-10", !denominationSelection && "text-subtle")}
                    >
                      <option value="">Select a denomination or tradition</option>
                      {denominationOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                      <option value={otherDenominationValue}>Other — please specify</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink" strokeWidth={2} />
                  </span>
                </label>
                {isOtherDenomination ? (
                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>Specify denomination or tradition</span>
                    <input
                      className={inputClass}
                      placeholder="Enter your denomination or tradition"
                      value={denomination}
                      onChange={(event) => setOrgDraft({ denomination: event.target.value })}
                    />
                  </label>
                ) : null}
                {field("denomination")}
              </div>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Year founded</span>
                <input
                  className={inputClass}
                  type="number"
                  inputMode="numeric"
                  min="1800"
                  max="3000"
                  placeholder="e.g. 2008"
                  value={orgDraft.founded ?? ""}
                  onChange={(e) => setOrgDraft({ founded: e.target.value })}
                />
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
                rows={7}
                className={`${inputClass} resize-none`}
                placeholder="Who you are, who you serve, and why it matters. Real stories and numbers build trust."
                value={orgDraft.bio ?? ""}
                onChange={(e) => setOrgDraft({ bio: e.target.value })}
              />
              <span className="flex items-center justify-between">
                {field("bio") ?? <span />}
                <span className="text-[13px] text-muted-ink">
                  {(orgDraft.bio?.trim().split(/\s+/).filter(Boolean).length ?? 0)} / 100–200 words
                </span>
              </span>
            </label>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-6">
            <StepTitle
              title="Add photos, links and proof"
              sub="Show givers the work and give our team the evidence to review it."
            />
            <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line-input bg-panel px-6 py-12 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-paper text-ink">
                <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <p className="text-base font-semibold text-ink">Upload photos of your work</p>
              <p className="text-sm text-muted-ink">
                Buildings, team, community, events — real photos, not stock. Select up to 8 at once (5 MB each).
              </p>
              <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => { void uploadFiles(event.target.files, "organization-photo"); event.target.value = ""; }} />
              <button type="button" onClick={() => photoInput.current?.click()} disabled={uploading || (orgDraft.photos?.length ?? 0) >= 8} className={`${btnSecondary} mt-2`}>
                {uploading ? "Uploading…" : (orgDraft.photos?.length ?? 0) >= 8 ? "8 photos added" : "Choose photos"}
              </button>
            </div>
            {field("photos")}
            {(orgDraft.photos?.length ?? 0) > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {orgDraft.photos?.map((photo) => <div key={photo} className="group relative overflow-hidden rounded-field bg-panel"><img src={photo} alt="Organization upload" className="aspect-square w-full object-cover" /><button type="button" aria-label="Remove photo" onClick={() => setOrgDraft({ photos: orgDraft.photos?.filter((item) => item !== photo) })} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-paper/90 text-danger opacity-0 shadow-sm transition-opacity group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button></div>)}
              </div>
            ) : null}
            <div className="flex flex-col gap-3 rounded-card border border-line-soft p-5">
              <div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-panel text-ink-soft"><FileText className="h-4 w-4" /></span><span><span className="block text-sm font-semibold text-ink">Registration evidence</span><span className="block text-[13px] text-muted-ink">CAC registration document or a recommendation letter from a recognized parent ministry.</span></span></div>
              <input ref={documentInput} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => { void uploadFiles(event.target.files, "organization-document"); event.target.value = ""; }} />
              <button type="button" onClick={() => documentInput.current?.click()} disabled={uploading || (orgDraft.registrationDocuments?.length ?? 0) >= 5} className={`${btnSecondary} self-start`}>{uploading ? "Uploading…" : "Add document"}</button>
              {(orgDraft.registrationDocuments?.length ?? 0) > 0 ? <ul className="flex flex-col gap-2">{orgDraft.registrationDocuments?.map((document) => <li key={document} className="flex items-center gap-2 rounded-field bg-panel px-3 py-2 text-sm text-ink-soft"><FileText className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{document.split("/").pop()}</span><button type="button" aria-label="Remove document" onClick={() => setOrgDraft({ registrationDocuments: orgDraft.registrationDocuments?.filter((item) => item !== document) })} className="text-danger"><Trash2 className="h-3.5 w-3.5" /></button></li>)}</ul> : null}
            </div>
            {field("documents")}
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>
                Relevant public link <span className="font-normal text-muted-ink">(optional)</span>
              </span>
              <input
                className={inputClass}
                placeholder="https://yourchurch.org or social profile"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    setOrgDraft({
                      videos: [...(orgDraft.videos ?? []), e.target.value.trim()],
                    });
                    e.target.value = "";
                  }
                }}
              />
              <span className="text-[13px] text-muted-ink">Press Enter to add each complete https:// or www. link.</span>
            </label>
            {(orgDraft.videos ?? []).length > 0 ? (
              <ul className="flex flex-col gap-2">
                {(orgDraft.videos ?? []).map((v, i) => (
                  <li
                    key={i}
                    className="truncate rounded-field bg-panel px-3.5 py-2.5 text-sm text-ink-soft"
                  >
                    {v}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-6">
            <StepTitle
              title="Review before publishing"
              sub="Your profile goes live straight away. You can edit everything later."
            />
            <Notice>
              Your profile starts with an <strong>unverified</strong> badge. Our team will contact
              you within 5 business days to verify your organization.
            </Notice>
          </div>
        ) : null}
      </div>
    </OnboardingShell>
  );
}

function StepTitle({ title, sub }: { title: string; sub: string }) {
  return <FlowTitle title={title} sub={sub} />;
}
