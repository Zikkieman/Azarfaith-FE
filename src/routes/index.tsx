import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle,
  Church,
  Flame,
  Globe,
  GraduationCap,
  HeartHandshake,
  MapPin,
  Repeat2,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";

import { useAppSelector } from "@/app/hooks";
import { Navbar } from "@/components/Navbar";
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
  component: LandingPage,
});

const categoryIcon = {
  church: Church,
  mission: Globe,
  orphanage: HeartHandshake,
  school: GraduationCap,
  other: Users,
} as const;

function LandingPage() {
  const authed = useAppSelector((state) => Boolean(state.auth.user));
  const browseHref = "/discover" as const;
  const orgCtaHref = authed ? ("/register-org" as const) : ("/signup" as const);
  const campaignCtaHref = authed ? ("/create" as const) : ("/signup" as const);
  const accountHref = authed ? ("/profile" as const) : ("/login" as const);

  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations", "landing"],
    queryFn: () => listOrganizations(),
  });
  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns", "landing"],
    queryFn: () => listCampaigns(),
  });

  const featuredOrgs = organizations.slice(0, 3);
  const ongoingCampaigns = campaigns.filter((campaign) => campaign.mode === "ongoing").slice(0, 2);
  const oneTimeCampaigns = campaigns
    .filter((campaign) => campaign.mode === "one-time")
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-background to-orange-50/40" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-28">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700">
              <Flame className="h-3.5 w-3.5" />
              Faith-based giving for Nigeria
            </div>
            <h1 className="font-display text-4xl leading-[1.1] tracking-tight md:text-6xl">
              Give to those doing <span className="text-amber-500">God&apos;s work</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Support churches, missionaries, orphanages, and faith-based schools across Nigeria.
              Give once for a specific need, or set up a standing order to sustain ongoing work.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={browseHref}
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
              >
                Browse causes
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={orgCtaHref}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-sm font-medium transition hover:bg-muted"
              >
                Register your org
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-amber-500" />
                All church sizes welcome
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-amber-500" />
                Transparent giving
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-amber-500" />
                Recurring support
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl md:text-4xl">Two ways to give</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Not every cause has a target. Some need a one-time push. Others need you every month.
          </p>
        </div>
        <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-8">
            <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-amber-100">
              <Target className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="font-display text-xl">One-time campaigns</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              A church needs to build. An orphanage needs beds. A displaced community needs
              emergency food. There&apos;s a target and a deadline, and your gift closes the gap.
            </p>
            <Link
              to={browseHref}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 transition hover:text-amber-700"
            >
              See campaigns
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="rounded-3xl border border-amber-200 bg-card p-8">
            <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-amber-100">
              <Repeat2 className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="font-display text-xl">Ongoing support</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              A missionary going to Borno every month doesn&apos;t need a campaign, they need a
              faithful community. Set up support for work that never stops.
            </p>
            <Link
              to={browseHref}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 transition hover:text-amber-700"
            >
              Find ongoing causes
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl md:text-4xl">Organizations on AzarFaith</h2>
              <p className="mt-2 text-muted-foreground">Vetted, transparent, doing the work.</p>
            </div>
            <Link
              to={browseHref}
              className="hidden items-center gap-1.5 text-sm font-medium text-amber-600 transition hover:text-amber-700 md:flex"
            >
              See all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {featuredOrgs.length > 0
              ? featuredOrgs.map((org) => {
                  const Icon = categoryIcon[org.category] ?? Users;
                  return (
                    <Link key={org.id} to="/org/$id" params={{ id: org.id }} className="group block">
                      <article className="overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-amber-200 hover:shadow-md">
                        <div className="aspect-[16/9] overflow-hidden">
                          <img
                            src={org.photos[0] ?? "https://placehold.co/1200x800/f6efe2/1f2937?text=AzarFaith"}
                            alt={org.name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          />
                        </div>
                        <div className="p-5">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                              <Icon className="h-3.5 w-3.5" />
                              {org.category}
                            </span>
                            {org.verificationStatus === "verified" ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-trust">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Verified
                              </span>
                            ) : null}
                          </div>
                          <h3 className="font-display text-lg leading-snug">{org.name}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">{org.tagline}</p>
                          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {org.location}
                          </div>
                          <div className="mt-4 flex items-center gap-4 text-xs">
                            <span>
                              <span className="font-semibold text-foreground">{formatMoney(org.totalReceived)}</span>{" "}
                              <span className="text-muted-foreground">received</span>
                            </span>
                            <span>
                              <span className="font-semibold text-foreground">{org.supporters}</span>{" "}
                              <span className="text-muted-foreground">supporters</span>
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  );
                })
              : Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-3xl border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
                    Organizations will appear here once the first approved profiles are live.
                  </div>
                ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <Repeat2 className="h-3.5 w-3.5" />
              Ongoing support
            </div>
            <h2 className="font-display text-3xl md:text-4xl">Give every month</h2>
            <p className="mt-2 text-muted-foreground">These causes don&apos;t have a finish line. They just need you.</p>
          </div>
          <Link
            to={browseHref}
            className="hidden items-center gap-1.5 text-sm font-medium text-amber-600 transition hover:text-amber-700 md:flex"
          >
            See all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {ongoingCampaigns.length > 0
            ? ongoingCampaigns.map((campaign) => (
                <Link key={campaign.id} to="/campaign/$id" params={{ id: campaign.id }} className="group block">
                  <article className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-amber-200 hover:shadow-md md:grid md:grid-cols-[12rem_1fr] md:gap-5">
                    <div className="aspect-[16/10] shrink-0 overflow-hidden md:h-full md:aspect-auto">
                      <img
                        src={campaign.cover}
                        alt={campaign.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="flex flex-col p-5">
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            <Repeat2 className="h-3 w-3" />
                            Ongoing
                          </span>
                          {campaign.verificationStatus === "verified" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-trust">
                              <ShieldCheck className="h-3 w-3" />
                              Verified
                            </span>
                          ) : null}
                        </div>
                        <h3 className="line-clamp-2 font-display text-lg leading-snug">{campaign.title}</h3>
                        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{campaign.story}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{campaign.donors} supporters</span>
                        <span className="font-medium text-amber-600">Give monthly</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))
            : (
              <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-sm text-muted-foreground md:col-span-2">
                No ongoing campaigns are live yet.
              </div>
            )}
        </div>
      </section>

      <section className="bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
                <Target className="h-3.5 w-3.5" />
                One-time campaigns
              </div>
              <h2 className="font-display text-3xl md:text-4xl">Help close the gap</h2>
              <p className="mt-2 text-muted-foreground">Specific needs with a target. Every naira brings them closer.</p>
            </div>
            <Link
              to={browseHref}
              className="hidden items-center gap-1.5 text-sm font-medium text-amber-600 transition hover:text-amber-700 md:flex"
            >
              See all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {oneTimeCampaigns.length > 0
              ? oneTimeCampaigns.map((campaign) => {
                  const pct = campaign.goal
                    ? Math.min(100, Math.round((campaign.raised / campaign.goal) * 100))
                    : 0;

                  return (
                    <Link key={campaign.id} to="/campaign/$id" params={{ id: campaign.id }} className="group block">
                      <article className="overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-amber-200 hover:shadow-md">
                        <div className="relative aspect-[16/9] overflow-hidden">
                          <img
                            src={campaign.cover}
                            alt={campaign.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          />
                          {campaign.urgency === "critical" || campaign.urgency === "high" ? (
                            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-urgent px-2.5 py-1 text-xs font-medium text-urgent-foreground">
                              <Flame className="h-3 w-3" />
                              Urgent
                            </span>
                          ) : null}
                        </div>
                        <div className="p-5">
                          <h3 className="line-clamp-2 font-display text-lg leading-snug">{campaign.title}</h3>
                          <div className="mt-4">
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="mt-2 flex items-baseline justify-between text-sm">
                              <span className="font-display">{formatMoney(campaign.raised)}</span>
                              <span className="text-xs text-muted-foreground">
                                of {formatMoney(campaign.goal ?? 0)} · {pct}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  );
                })
              : (
                <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-sm text-muted-foreground md:col-span-2">
                  No one-time campaigns are live yet.
                </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl md:text-4xl">Who AzarFaith is for</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Not the big names. The ones in the villages, under bridges, and in the bush.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["Missionaries", "Reaching unreached communities across Nigeria", Globe],
            ["Core churches", "The churches meeting under zinc roofs and growing quietly", Church],
            ["Orphanages", "Faith-based homes caring for displaced children", HeartHandshake],
            ["Faith schools", "Affordable Christian education in underserved areas", GraduationCap],
          ].map(([title, body, Icon]) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-5 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-50">
                <Icon className="h-7 w-7 text-amber-500" />
              </div>
              <div className="text-sm font-semibold">{title}</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-amber-50 py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-2 md:px-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl">How we keep it honest</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              AzarFaith is built on verified trust infrastructure. Orgs provide documentation,
              post regular updates, and are subject to community reporting. No private donations,
              everything goes through the platform.
            </p>
            <div className="mt-8 space-y-4">
              {[
                "Org profiles with real photos and verified denominations",
                "Regular update posts so you see how your money is used",
                "Platform fee transparency on every donation",
                "Community reporting with admin review",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {featuredOrgs.slice(0, 4).map((org) => (
              <Link key={org.id} to="/org/$id" params={{ id: org.id }} className="group">
                <div className="aspect-square overflow-hidden rounded-2xl">
                  <img
                    src={org.photos[0] ?? "https://placehold.co/600x600/f6efe2/1f2937?text=AzarFaith"}
                    alt={org.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                  />
                </div>
                <p className="mt-2 truncate text-xs font-medium">{org.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 text-center md:px-8 md:py-24">
        <h2 className="font-display text-3xl text-balance md:text-5xl">Ready to give faith?</h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Browse causes and set up support today. Or register your org and let Nigeria&apos;s
          Christian community find you.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to={browseHref}
            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-8 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
          >
            Browse all causes
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to={orgCtaHref}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-8 py-4 text-sm font-medium transition hover:bg-muted"
          >
            Register your org
          </Link>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500">
                  <Flame className="h-5 w-5 fill-white text-white" />
                </div>
                <span className="font-display text-xl tracking-tight">AzarFaith</span>
              </Link>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Faith-based giving for Nigeria. Verified churches, missionaries, and ministries.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-display text-sm font-semibold">Platform</h4>
              <ul className="space-y-2.5">
                <li><Link to={browseHref} className="text-sm text-muted-foreground transition hover:text-foreground">Discover causes</Link></li>
                <li><Link to={campaignCtaHref} className="text-sm text-muted-foreground transition hover:text-foreground">Start a campaign</Link></li>
                <li><Link to={orgCtaHref} className="text-sm text-muted-foreground transition hover:text-foreground">Register your org</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-display text-sm font-semibold">Account</h4>
              <ul className="space-y-2.5">
                <li><Link to={accountHref} className="text-sm text-muted-foreground transition hover:text-foreground">{authed ? "Profile" : "Log in"}</Link></li>
                <li><Link to={authed ? "/my-giving" : "/signup"} className="text-sm text-muted-foreground transition hover:text-foreground">{authed ? "My giving" : "Create account"}</Link></li>
                <li><Link to={authed ? "/manage" : "/signup"} className="text-sm text-muted-foreground transition hover:text-foreground">{authed ? "Manage" : "Get started"}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-display text-sm font-semibold">Trust</h4>
              <ul className="space-y-2.5">
                <li><Link to={browseHref} className="text-sm text-muted-foreground transition hover:text-foreground">Verified orgs only</Link></li>
                <li><Link to={browseHref} className="text-sm text-muted-foreground transition hover:text-foreground">Report a cause</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
            <p className="text-sm text-muted-foreground">© 2026 AzarFaith. All rights reserved.</p>
            <p className="text-xs text-muted-foreground">Built with faith for Nigeria</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
