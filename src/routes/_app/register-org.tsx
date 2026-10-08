import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  AppShell,
  BackLink,
  ChoiceCard,
  Container,
  FieldError,
  FlowTitle,
  Notice,
  Stepper,
  Tag,
  cardClass,
  inputClass,
  labelClass,
  smallHeadingClass,
} from "@/components/app/AppShell";
import { btnPrimary, btnSecondary } from "@/components/app/btn";
import { useApp } from "@/lib/store";
import { toast } from "sonner";
import { Church, Globe, Baby, GraduationCap, Users, ImagePlus } from "lucide-react";
import type { Org } from "@/lib/mock";

export const Route = createFileRoute("/_app/register-org")({
  head: () => ({ meta: [{ title: "Register your org — AzarFaith" }] }),
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

function RegisterOrg() {
  const nav = useNavigate();
  const { orgDraft, setOrgDraft, resetOrgDraft, addOrg } = useApp();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const steps = ["Details", "Mission", "Media", "Preview"];

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!orgDraft.name?.trim()) e.name = "Organization name is required";
      if (!orgDraft.category) e.category = "Select a category";
      if (!orgDraft.denomination?.trim()) e.denomination = "Denomination or tradition is required";
      if (!orgDraft.location?.trim()) e.location = "Location is required";
    }
    if (step === 1) {
      if (!orgDraft.tagline?.trim() || orgDraft.tagline.length < 10)
        e.tagline = "Add a short tagline (at least 10 characters)";
      if (!orgDraft.bio?.trim() || orgDraft.bio.length < 60)
        e.bio = "Tell us more about your org (at least 60 characters)";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate()) return;
    setStep((s) => s + 1);
  };

  const submit = () => {
    setSubmitting(true);
    setTimeout(() => {
      const org: Org = {
        id: `o${Math.random().toString(36).slice(2)}`,
        name: orgDraft.name!,
        tagline: orgDraft.tagline!,
        category: orgDraft.category!,
        denomination: orgDraft.denomination!,
        location: orgDraft.location!,
        founded: orgDraft.founded ?? "2020",
        bio: orgDraft.bio!,
        photos: orgDraft.photos ?? [],
        videos: orgDraft.videos ?? [],
        campaignIds: [],
        verificationStatus: "unverified",
        totalReceived: 0,
        supporters: 0,
      };
      addOrg(org);
      resetOrgDraft();
      toast("Your org is live on AzarFaith");
      nav({ to: "/org/$id", params: { id: org.id } });
    }, 1000);
  };

  const field = (key: keyof typeof errors) =>
    errors[key] ? <FieldError>{errors[key]}</FieldError> : null;
  const selectedCategory = orgCategories.find((c) => c.v === orgDraft.category);

  return (
    <AppShell>
      <Container className="py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-10">
            <div className="flex flex-col gap-6">
              <BackLink to="/dashboard">Back to Manage</BackLink>
              <Stepper steps={steps} current={step} />
            </div>

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
                  <div className="grid gap-3 xl:grid-cols-2">
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
                      {orgDraft.bio?.length ?? 0} / 60 minimum
                    </span>
                  </span>
                </label>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="flex flex-col gap-6">
                <StepTitle
                  title="Add photos and videos"
                  sub="Show givers the work. Nothing builds trust faster."
                />
                <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line-input bg-panel px-6 py-12 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-paper text-ink">
                    <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <p className="text-base font-semibold text-ink">Upload photos of your work</p>
                  <p className="text-sm text-muted-ink">
                    Buildings, team, community, events — real photos, not stock.
                  </p>
                  <button
                    type="button"
                    onClick={() => toast("Photo upload is coming soon")}
                    className={`${btnSecondary} mt-2`}
                  >
                    Choose photos
                  </button>
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>
                    YouTube or Vimeo link{" "}
                    <span className="font-normal text-muted-ink">(optional)</span>
                  </span>
                  <input
                    className={inputClass}
                    placeholder="https://youtube.com/watch?v=…"
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
                  <span className="text-[13px] text-muted-ink">Press Enter to add a link.</span>
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
                  Your profile starts with an <strong>unverified</strong> badge. Our team will
                  contact you within 5 business days to verify your organization.
                </Notice>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-6 [&>button]:flex-1 sm:[&>button]:flex-none">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className={btnSecondary}
                >
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
                  {submitting ? "Publishing…" : "Publish org profile"}
                </button>
              )}
            </div>
          </div>

          <aside
            className={`lg:sticky lg:top-24 lg:block lg:self-start ${step === 3 ? "" : "hidden"}`}
          >
            <p className={`${smallHeadingClass} pb-3`}>Preview</p>
            <div className={`${cardClass} flex flex-col gap-4 p-6`}>
              <div className="grid h-[180px] w-full place-items-center rounded-field bg-panel text-muted-ink">
                <ImagePlus className="h-8 w-8" strokeWidth={1.5} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Tag>{selectedCategory?.label ?? "Category"}</Tag>
                <Tag>Unverified</Tag>
              </div>
              <p className="font-display text-2xl leading-[1.2] text-ink">
                {orgDraft.name || "Your organization"}
              </p>
              <p className="text-sm leading-5 text-muted-ink">
                {orgDraft.tagline || "Your one-line tagline appears here."}
              </p>
              <p className="text-[13px] text-muted-ink">
                {[
                  orgDraft.denomination,
                  orgDraft.location,
                  orgDraft.founded && `Est. ${orgDraft.founded}`,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Denomination · Location · Founded"}
              </p>
              {orgDraft.bio ? (
                <p className="line-clamp-4 border-t border-line-soft pt-4 text-sm leading-[21px] text-ink-soft">
                  {orgDraft.bio}
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </Container>
    </AppShell>
  );
}

function StepTitle({ title, sub }: { title: string; sub: string }) {
  return <FlowTitle title={title} sub={sub} />;
}
