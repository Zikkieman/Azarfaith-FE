import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  Repeat2,
  Target,
  Church,
  Users,
  GraduationCap,
  Baby,
  Globe,
  CheckCircle,
  Heart,
  MapPin,
  Flame,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useApp } from "@/lib/store";
import { formatMoney } from "@/lib/mock";

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

const orgCategoryIcon: Record<string, React.ReactNode> = {
  church: <Church className="w-5 h-5" />,
  mission: <Globe className="w-5 h-5" />,
  orphanage: <Baby className="w-5 h-5" />,
  school: <GraduationCap className="w-5 h-5" />,
  other: <Users className="w-5 h-5" />,
};

const orgCategoryLabel: Record<string, string> = {
  church: "Church",
  mission: "Mission",
  orphanage: "Orphanage",
  school: "School",
  other: "Ministry",
};

function AzarFaithLanding() {
  const { campaigns, orgs } = useApp();

  const featuredOrgs = orgs.slice(0, 3);
  const ongoingCampaigns = campaigns.filter((c) => c.mode === "ongoing").slice(0, 2);
  const oneTimeCampaigns = campaigns.filter((c) => c.mode === "one-time" && c.goal).slice(0, 2);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-background to-orange-50/40" />
        <div className="relative mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium mb-6">
              <Flame className="w-3.5 h-3.5" /> Faith-based giving for Nigeria
            </div>
            <h1 className="font-display text-4xl md:text-6xl leading-[1.1] tracking-tight">
              Give to those doing <span className="text-amber-500">God's work</span>
            </h1>
            <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Support churches, missionaries, orphanages, and faith-based schools across Nigeria.
              Give once for a specific need, or set up a standing order to sustain ongoing work.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition shadow-sm"
              >
                Browse causes <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register-org"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-border bg-card font-medium text-sm hover:bg-muted transition"
              >
                Register your org
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-amber-500" /> All church sizes welcome
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-amber-500" /> Transparent giving
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-amber-500" /> Recurring support
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TWO WAYS TO GIVE ─── */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl">Two ways to give</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Not every cause has a target. Some need a one-time push. Others need you every month.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="bg-card border border-border rounded-3xl p-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 grid place-items-center mb-5">
              <Target className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-display text-xl">One-time campaigns</h3>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
              A church needs to build. An orphanage needs beds. A displaced community needs
              emergency food. There's a target and a deadline — your gift closes the gap.
            </p>
            <Link
              to="/discover"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 transition"
            >
              See campaigns <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-card border border-amber-200 rounded-3xl p-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 grid place-items-center mb-5">
              <Repeat2 className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-display text-xl">Ongoing support</h3>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
              A missionary going to Borno every month doesn't need a campaign — they need a faithful
              community. Set up a weekly, monthly, or quarterly standing order for work that never
              stops.
            </p>
            <Link
              to="/discover"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 transition"
            >
              Find ongoing causes <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FEATURED ORGS ─── */}
      <section className="bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-display text-3xl md:text-4xl">Organizations on AzarFaith</h2>
              <p className="mt-2 text-muted-foreground">Vetted, transparent, doing the work.</p>
            </div>
            <Link
              to="/discover"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 transition"
            >
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {featuredOrgs.map((org) => (
              <Link key={org.id} to="/org/$id" params={{ id: org.id }} className="group block">
                <article className="bg-card border border-border rounded-3xl overflow-hidden hover:border-amber-200 hover:shadow-md transition-all">
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={org.photos[0]}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                        {orgCategoryIcon[org.category]} {orgCategoryLabel[org.category]}
                      </span>
                      {org.verificationStatus === "verified" && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-trust">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-lg leading-snug">{org.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{org.tagline}</p>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {org.location}
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs">
                      <span>
                        <span className="font-semibold text-foreground">
                          {formatMoney(org.totalReceived)}
                        </span>{" "}
                        <span className="text-muted-foreground">received</span>
                      </span>
                      <span>
                        <span className="font-semibold text-foreground">
                          {org.supporters.toLocaleString()}
                        </span>{" "}
                        <span className="text-muted-foreground">supporters</span>
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ONGOING CAMPAIGNS ─── */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 mb-2">
              <Repeat2 className="w-3.5 h-3.5" /> Ongoing support
            </div>
            <h2 className="font-display text-3xl md:text-4xl">Give every month</h2>
            <p className="mt-2 text-muted-foreground">
              These causes don't have a finish line. They just need you.
            </p>
          </div>
          <Link
            to="/discover"
            className="hidden md:flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 transition"
          >
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-5 items-start">
          {ongoingCampaigns.map((c) => (
            <Link key={c.id} to="/campaign/$id" params={{ id: c.id }} className="group block">
              <article className="bg-card border border-border rounded-3xl overflow-hidden hover:border-amber-200 hover:shadow-md transition-all flex gap-0 md:gap-5 flex-col md:flex-row">
                <div className="md:w-48 aspect-[16/10] md:aspect-auto overflow-hidden shrink-0">
                  <img
                    src={c.cover}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
                  />
                </div>
                <div className="p-5 flex flex-col">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        <Repeat2 className="w-3 h-3" /> Ongoing
                      </span>
                      {c.verificationStatus === "verified" && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-trust">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-lg leading-snug line-clamp-2">{c.title}</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{c.story}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {c.donors.toLocaleString()} supporters
                    </span>
                    <span className="font-medium text-amber-600">Give monthly</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── ONE-TIME CAMPAIGNS ─── */}
      <section className="bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 mb-2">
                <Target className="w-3.5 h-3.5" /> One-time campaigns
              </div>
              <h2 className="font-display text-3xl md:text-4xl">Help close the gap</h2>
              <p className="mt-2 text-muted-foreground">
                Specific needs with a target. Every naira brings them closer.
              </p>
            </div>
            <Link
              to="/discover"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 transition"
            >
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {oneTimeCampaigns.map((c) => {
              const pct = c.goal ? Math.min(100, Math.round((c.raised / c.goal) * 100)) : 0;
              return (
                <Link key={c.id} to="/campaign/$id" params={{ id: c.id }} className="group block">
                  <article className="bg-card border border-border rounded-3xl overflow-hidden hover:border-amber-200 hover:shadow-md transition-all">
                    <div className="aspect-[16/9] overflow-hidden relative">
                      <img
                        src={c.cover}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
                      />
                      {c.urgency === "critical" && (
                        <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-urgent text-urgent-foreground">
                          <Flame className="w-3 h-3" /> Urgent
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-lg leading-snug line-clamp-2">{c.title}</h3>
                      <div className="mt-4">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mt-2 flex items-baseline justify-between text-sm">
                          <span className="font-display">{formatMoney(c.raised)}</span>
                          <span className="text-xs text-muted-foreground">
                            of {formatMoney(c.goal ?? 0)} · {pct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── WHO WE SERVE ─── */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl">Who AzarFaith is for</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Not the big names. The ones in the villages, under bridges, and in the bush.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: <Globe className="w-7 h-7 text-amber-500" />,
              label: "Missionaries",
              desc: "Reaching unreached communities across Nigeria",
            },
            {
              icon: <Church className="w-7 h-7 text-amber-500" />,
              label: "Core churches",
              desc: "Not Covenant Nation. The ones meeting under zinc roofs",
            },
            {
              icon: <Baby className="w-7 h-7 text-amber-500" />,
              label: "Orphanages",
              desc: "Faith-based homes caring for displaced children",
            },
            {
              icon: <GraduationCap className="w-7 h-7 text-amber-500" />,
              label: "Faith schools",
              desc: "Affordable Christian education in underserved areas",
            },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 grid place-items-center mx-auto mb-4">
                {icon}
              </div>
              <div className="font-semibold text-sm">{label}</div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TRUST SECTION ─── */}
      <section className="bg-amber-50 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl">How we keep it honest</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                AzarFaith is built on verified trust infrastructure. Orgs provide documentation,
                post regular updates, and are subject to community reporting. No private donations —
                everything goes through the platform.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  {
                    icon: <ShieldCheck className="w-4 h-4 text-amber-600" />,
                    text: "Org profiles with real photos and verified denominations",
                  },
                  {
                    icon: <Heart className="w-4 h-4 text-amber-600" />,
                    text: "Regular update posts — you see how your money is used",
                  },
                  {
                    icon: <CheckCircle className="w-4 h-4 text-amber-600" />,
                    text: "2.5% platform fee — the rest goes to the cause",
                  },
                  {
                    icon: <Users className="w-4 h-4 text-amber-600" />,
                    text: "Community can flag orgs — admin reviews within 24 hours",
                  },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-sm">
                    {icon}
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {orgs.slice(0, 4).map((org) => (
                <Link key={org.id} to="/org/$id" params={{ id: org.id }} className="group">
                  <div className="aspect-square rounded-2xl overflow-hidden">
                    <img
                      src={org.photos[0]}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-300"
                    />
                  </div>
                  <p className="text-xs font-medium mt-2 truncate">{org.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-24 text-center">
        <h2 className="font-display text-3xl md:text-5xl text-balance">Ready to give faith?</h2>
        <p className="mt-4 text-muted-foreground max-w-md mx-auto">
          Browse causes and set up a monthly gift today. Or register your org and let Nigeria's
          Christian community find you.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/discover"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-amber-500 text-white font-semibold hover:bg-amber-600 transition shadow-sm"
          >
            Browse all causes <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register-org"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-border bg-card font-medium hover:bg-muted transition"
          >
            Register your org
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
