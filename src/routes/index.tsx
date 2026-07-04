import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  CheckCircle,
  Flame,
  HeartHandshake,
  MapPin,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageSpinner } from "@/components/PageSpinner";
import { listCampaigns, listOrganizations } from "@/features/catalog/api";
import { formatMoney } from "@/lib/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AzarFaith — Give to those doing God's work in Nigeria" },
      {
        name: "description",
        content:
          "Support churches, missionaries, orphanages and faith-based schools in Nigeria. Give once or set up a standing order.",
      },
    ],
  }),
  component: AzarFaithLanding,
});

function EmptyPanel({
  title,
  body,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  body: string;
  primaryHref: "/create" | "/register-org" | "/discover";
  primaryLabel: string;
  secondaryHref?: "/create" | "/register-org" | "/discover";
  secondaryLabel?: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/70 p-8 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
        <Building2 className="h-5 w-5" />
      </div>
      <h3 className="font-display text-xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Link
          to={primaryHref}
          className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
        >
          {primaryLabel}
        </Link>
        {secondaryHref && secondaryLabel && (
          <Link
            to={secondaryHref}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-muted"
          >
            {secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

function AzarFaithLanding() {
  const { data: orgs = [], isLoading: orgsLoading } = useQuery({
    queryKey: ["organizations", "landing"],
    queryFn: () => listOrganizations(),
  });
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["campaigns", "landing"],
    queryFn: () => listCampaigns(),
  });

  const featuredOrgs = orgs.slice(0, 3);
  const ongoingCampaigns = campaigns
    .filter((campaign) => campaign.mode === "ongoing")
    .slice(0, 2);
  const oneTimeCampaigns = campaigns
    .filter((campaign) => campaign.mode === "one-time" && campaign.goal)
    .slice(0, 2);
  const hasAnyData = orgs.length > 0 || campaigns.length > 0;
  const heroCampaign = campaigns[0] ?? null;
  const heroOrg = orgs[0] ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-background to-orange-50/40" />
        <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.12),_transparent_32%),radial-gradient(circle_at_75%_25%,_rgba(251,191,36,0.12),_transparent_24%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-center lg:gap-10">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700">
              <Flame className="h-3.5 w-3.5" /> Faith-based giving for Nigeria
            </div>
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight md:text-6xl">
              Give to those doing <span className="text-amber-500">God's work</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Support churches, missionaries, orphanages, and faith-based schools across Nigeria.
              Give once for a specific need, or set up a standing order to sustain ongoing work.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
              >
                Browse causes <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register-org"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-sm font-medium transition hover:bg-muted"
              >
                Register your org
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-amber-500" /> Transparent giving
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-amber-500" /> Verified organizations
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-amber-500" /> Recurring support
              </span>
            </div>
          </div>

          <div className="relative lg:pl-6">
            <div className="absolute -left-2 top-4 hidden rounded-2xl border border-amber-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur md:block">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-amber-700">
                <Sparkles className="h-3.5 w-3.5" /> Live giving
              </div>
              <p className="mt-1 font-display text-lg">{campaignsLoading ? "..." : campaigns.length} active causes</p>
            </div>
            <div className="absolute -right-2 bottom-8 hidden rounded-2xl border border-amber-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur md:block">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-amber-700">
                Community
              </div>
              <p className="mt-1 font-display text-lg">{orgsLoading ? "..." : orgs.length} orgs onboarded</p>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-white/80 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.25)] backdrop-blur">
              <div className="border-b border-border/70 bg-gradient-to-r from-amber-500 to-orange-400 px-6 py-5 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/80">
                      Right now on AzarFaith
                    </p>
                    <h2 className="mt-2 font-display text-2xl">Support is ready to move</h2>
                  </div>
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/18">
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl bg-amber-50 px-4 py-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-amber-700">
                      Organizations
                    </p>
                    <p className="mt-2 font-display text-3xl">{orgsLoading ? "..." : orgs.length}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600">
                      Campaigns
                    </p>
                    <p className="mt-2 font-display text-3xl">{campaignsLoading ? "..." : campaigns.length}</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 px-4 py-4 sm:col-span-2 xl:col-span-1">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-700">
                      Giving model
                    </p>
                    <p className="mt-2 font-display text-2xl leading-tight">One-time + recurring</p>
                    <p className="mt-2 text-sm leading-relaxed text-emerald-900/70">
                      Built for direct gifts today and repeat support next.
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-slate-50 to-white p-5">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="max-w-md">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-700">
                        Featured cause
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {heroCampaign
                          ? "The platform can already display live campaigns to donors."
                          : "The first published campaign will show here with progress, donor momentum, and quick context for supporters."}
                      </p>
                    </div>
                    <span className="inline-flex whitespace-nowrap rounded-full bg-amber-100 px-3.5 py-1.5 text-xs font-medium leading-none text-amber-700">
                      {heroCampaign?.mode === "ongoing" ? "Ongoing" : heroCampaign ? "One-time" : "Awaiting first cause"}
                    </span>
                  </div>

                  {heroCampaign ? (
                    <>
                      <h3 className="font-display text-2xl leading-tight">{heroCampaign.title}</h3>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{heroCampaign.raiser.name}</span>
                        <span>·</span>
                        <MapPin className="h-3 w-3" />
                        <span>{heroCampaign.location}</span>
                      </div>
                      <div className="mt-4 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-amber-500"
                          style={{
                            width: `${heroCampaign.goal ? Math.min(100, Math.round((heroCampaign.raised / heroCampaign.goal) * 100)) : 100}%`,
                          }}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="font-medium">{formatMoney(heroCampaign.raised)} raised</span>
                        <span className="text-muted-foreground">
                          {heroCampaign.goal
                            ? `of ${formatMoney(heroCampaign.goal)}`
                            : `${heroCampaign.donors.toLocaleString()} supporters`}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-amber-200 bg-white/80 p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                          <Target className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-display text-xl leading-tight text-slate-900">The first cause will anchor this space</h3>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            Once a campaign is published, donors will immediately see its title, location, and giving progress here.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-700">
                      Organizations
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {heroOrg
                        ? `${heroOrg.name} is already visible to donors and can host multiple campaigns.`
                        : "Churches, missions, orphanages, and schools will show up here once registered."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-700">
                      Campaign flow
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Create as an individual or under an organization, then let donors discover and support it.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl md:text-4xl">Live on AzarFaith</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Real organizations and campaigns are now being read directly from the backend.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-border bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-600">
              Organizations
            </p>
            <p className="mt-3 font-display text-4xl">{orgsLoading ? "..." : orgs.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Faith-based organizations available to discover.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-600">
              Campaigns
            </p>
            <p className="mt-3 font-display text-4xl">{campaignsLoading ? "..." : campaigns.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              One-time and ongoing causes currently listed.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-600">
              Giving model
            </p>
            <p className="mt-3 font-display text-2xl">One-time + recurring</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Structured for campaigns today and recurring gifts next.
            </p>
          </div>
        </div>
      </section>

      {!orgsLoading && !campaignsLoading && !hasAnyData && (
        <section className="mx-auto max-w-5xl px-5 pb-4 md:px-8">
          <EmptyPanel
            title="AzarFaith is ready for the first causes"
            body="No campaigns or organizations have been published yet. The first user can either register an organization or create a personal campaign and it will start appearing across the app."
            primaryHref="/create"
            primaryLabel="Create a campaign"
            secondaryHref="/register-org"
            secondaryLabel="Register an organization"
          />
        </section>
      )}

      <section className="bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl md:text-4xl">Organizations on AzarFaith</h2>
              <p className="mt-2 text-muted-foreground">Vetted, transparent, doing the work.</p>
            </div>
            <Link
              to="/discover"
              className="hidden items-center gap-1.5 text-sm font-medium text-amber-600 transition hover:text-amber-700 md:flex"
            >
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {orgsLoading ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/60"><PageSpinner label="Loading organizations..." fullScreen={false} /></div>
          ) : featuredOrgs.length === 0 ? (
            <EmptyPanel
              title="No organizations yet"
              body="Once a church, mission, orphanage, school, or ministry registers, it will appear here for donors to discover."
              primaryHref="/register-org"
              primaryLabel="Register an organization"
              secondaryHref="/create"
              secondaryLabel="Create a personal campaign"
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {featuredOrgs.map((org) => (
                <Link key={org.id} to="/org/$id" params={{ id: org.id }} className="group block">
                  <article className="overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-amber-200 hover:shadow-md">
                    <div className="aspect-[16/9] overflow-hidden bg-muted">
                      {org.photos[0] ? (
                        <img
                          src={org.photos[0]}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">
                          No image yet
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                          {org.category}
                        </span>
                        {org.verificationStatus === "verified" && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-trust">
                            <ShieldCheck className="h-3.5 w-3.5" /> Verified
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-lg leading-snug">{org.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{org.tagline}</p>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {org.location}
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-xs">
                        <span>
                          <span className="font-semibold text-foreground">{formatMoney(org.totalReceived)}</span>{" "}
                          <span className="text-muted-foreground">received</span>
                        </span>
                        <span>
                          <span className="font-semibold text-foreground">{org.supporters.toLocaleString()}</span>{" "}
                          <span className="text-muted-foreground">supporters</span>
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <Repeat2 className="h-3.5 w-3.5" /> Ongoing support
            </div>
            <h2 className="font-display text-3xl md:text-4xl">Give every month</h2>
          </div>
          <Link
            to="/discover"
            className="hidden items-center gap-1.5 text-sm font-medium text-amber-600 transition hover:text-amber-700 md:flex"
          >
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {campaignsLoading ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/60"><PageSpinner label="Loading campaigns..." fullScreen={false} /></div>
        ) : ongoingCampaigns.length === 0 ? (
          <EmptyPanel
            title="No ongoing campaigns yet"
            body="Recurring support campaigns will show here once a user or organization publishes a cause that needs continuous giving."
            primaryHref="/create"
            primaryLabel="Create an ongoing campaign"
            secondaryHref="/discover"
            secondaryLabel="Browse discover"
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {ongoingCampaigns.map((campaign) => (
              <Link key={campaign.id} to="/campaign/$id" params={{ id: campaign.id }} className="group block">
                <article className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-amber-200 hover:shadow-md md:grid md:grid-cols-[12rem_1fr] md:gap-5">
                  <div className="aspect-[16/10] overflow-hidden md:h-full md:aspect-auto">
                    <img
                      src={campaign.cover}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-col p-5">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <Repeat2 className="h-3 w-3" /> Ongoing
                      </span>
                      {campaign.verificationStatus === "verified" && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-trust">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-lg leading-snug line-clamp-2">{campaign.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{campaign.story}</p>
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{campaign.donors.toLocaleString()} supporters</span>
                      <span className="font-medium text-amber-600">{formatMoney(campaign.raised)} raised</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 md:px-8 md:pb-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <Target className="h-3.5 w-3.5" /> One-time campaigns
            </div>
            <h2 className="font-display text-3xl md:text-4xl">Back a specific need</h2>
          </div>
        </div>
        {campaignsLoading ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/60"><PageSpinner label="Loading campaigns..." fullScreen={false} /></div>
        ) : oneTimeCampaigns.length === 0 ? (
          <EmptyPanel
            title="No one-time campaigns yet"
            body="Specific fundraising targets like building projects, emergency support, or equipment needs will appear here once someone publishes them."
            primaryHref="/create"
            primaryLabel="Create a one-time campaign"
            secondaryHref="/discover"
            secondaryLabel="Browse discover"
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {oneTimeCampaigns.map((campaign) => {
              const pct = campaign.goal ? Math.min(100, Math.round((campaign.raised / campaign.goal) * 100)) : 0;
              return (
                <Link key={campaign.id} to="/campaign/$id" params={{ id: campaign.id }} className="group block">
                  <article className="overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-amber-200 hover:shadow-md">
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={campaign.cover}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                          <Target className="h-3 w-3" /> One-time
                        </span>
                      </div>
                      <h3 className="font-display text-lg leading-snug">{campaign.title}</h3>
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium">{formatMoney(campaign.raised)}</span>
                        <span className="text-muted-foreground">
                          of {formatMoney(campaign.goal ?? 0)} · {pct}%
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
