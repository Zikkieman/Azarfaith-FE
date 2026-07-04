import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Baby,
  Church,
  Flame,
  Globe,
  GraduationCap,
  MapPin,
  Repeat2,
  Search,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { PageSpinner } from "@/components/PageSpinner";
import { listCampaigns, listOrganizations } from "@/features/catalog/api";
import { faithCategoryOptions, formatMoney } from "@/lib/catalog";

export const Route = createFileRoute("/discover")({
  component: AzarFaithDiscover,
});

const orgCategoryIcon: Record<string, JSX.Element> = {
  church: <Church className="h-4 w-4" />,
  mission: <Globe className="h-4 w-4" />,
  orphanage: <Baby className="h-4 w-4" />,
  school: <GraduationCap className="h-4 w-4" />,
  other: <Users className="h-4 w-4" />,
};

type Tab = "all" | "ongoing" | "one-time" | "orgs";

function DiscoverEmptyState({
  title,
  body,
  primaryHref,
  primaryLabel,
}: {
  title: string;
  body: string;
  primaryHref: "/create" | "/register-org";
  primaryLabel: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/70 px-6 py-14 text-center text-muted-foreground">
      <p className="font-display text-2xl text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed">{body}</p>
      <Link
        to={primaryHref}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
      >
        {primaryLabel}
      </Link>
    </div>
  );
}

function AzarFaithDiscover() {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["campaigns", "discover", tab, search, categoryFilter],
    queryFn: () =>
      listCampaigns({
        search: search || undefined,
        mode: tab === "ongoing" ? "ONGOING" : tab === "one-time" ? "ONE_TIME" : undefined,
        faithCategory: categoryFilter ?? undefined,
      }),
  });

  const { data: orgs = [], isLoading: orgsLoading } = useQuery({
    queryKey: ["organizations", "discover", search],
    queryFn: () => listOrganizations({ search: search || undefined }),
  });

  const tabs: { value: Tab; label: string; count: number }[] = [
    { value: "all", label: "All campaigns", count: campaigns.length },
    {
      value: "ongoing",
      label: "Ongoing",
      count:
        tab === "ongoing"
          ? campaigns.length
          : campaigns.filter((campaign) => campaign.mode === "ongoing").length,
    },
    {
      value: "one-time",
      label: "One-time",
      count:
        tab === "one-time"
          ? campaigns.length
          : campaigns.filter((campaign) => campaign.mode === "one-time").length,
    },
    { value: "orgs", label: "Organizations", count: orgs.length },
  ];

  const isGlobalEmpty = !campaignsLoading && !orgsLoading && campaigns.length === 0 && orgs.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl">Discover AzarFaith causes</h1>
          <p className="mt-2 text-muted-foreground">
            Find missionaries, churches, orphanages, and schools to support.
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="Search campaigns, orgs, or locations…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="mb-6 flex items-center gap-1 overflow-x-auto pb-1">
          {tabs.map(({ value, label, count }) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition ${tab === value ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${tab === value ? "bg-amber-600 text-white" : "bg-background text-muted-foreground"}`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {tab !== "orgs" && (
          <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCategoryFilter(null)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${!categoryFilter ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              All categories
            </button>
            {faithCategoryOptions.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setCategoryFilter(categoryFilter === option.value ? null : option.value)
                }
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${categoryFilter === option.value ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                <span>{option.icon}</span> {option.label}
              </button>
            ))}
          </div>
        )}

        {isGlobalEmpty && !search && (
          <DiscoverEmptyState
            title="No causes have been published yet"
            body="The platform is empty right now. A user can create a personal campaign, or register an organization and create campaigns under it."
            primaryHref="/create"
            primaryLabel="Create the first campaign"
          />
        )}

        {tab !== "orgs" && !isGlobalEmpty && (
          <>
            {campaignsLoading ? (
              <PageSpinner label="Loading campaigns..." fullScreen={false} />
            ) : campaigns.length === 0 ? (
              <DiscoverEmptyState
                title="No campaigns found"
                body={
                  search || categoryFilter
                    ? "Try a different search or category filter."
                    : "No campaigns have been published yet. The first campaign created will appear here."
                }
                primaryHref="/create"
                primaryLabel="Create a campaign"
              />
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.map((campaign) => {
                  const pct = campaign.goal ? Math.min(100, Math.round((campaign.raised / campaign.goal) * 100)) : null;
                  return (
                    <Link key={campaign.id} to="/campaign/$id" params={{ id: campaign.id }} className="group block">
                      <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-amber-200 hover:shadow-md">
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <img
                            src={campaign.cover}
                            alt=""
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                          />
                          <div className="absolute left-3 top-3 flex gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${campaign.mode === "ongoing" ? "bg-amber-100 text-amber-700" : "border border-border bg-card/90 text-foreground"}`}
                            >
                              {campaign.mode === "ongoing" ? (
                                <>
                                  <Repeat2 className="h-3 w-3" /> Ongoing
                                </>
                              ) : (
                                <>
                                  <Target className="h-3 w-3" /> One-time
                                </>
                              )}
                            </span>
                            {campaign.verificationStatus === "verified" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-trust px-2.5 py-1 text-[11px] font-medium text-trust-foreground">
                                <ShieldCheck className="h-3 w-3" /> Verified
                              </span>
                            )}
                            {campaign.urgency === "critical" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-urgent px-2.5 py-1 text-[11px] font-medium text-urgent-foreground">
                                <Flame className="h-3 w-3" /> Urgent
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                          <p className="mb-1 text-xs font-medium text-amber-600">{campaign.faithCategory}</p>
                          <h3 className="flex-1 font-display text-[16px] leading-snug line-clamp-2">
                            {campaign.title}
                          </h3>
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="truncate">{campaign.raiser.name}</span>
                            <span>·</span>
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{campaign.location}</span>
                          </div>
                          <div className="mt-3">
                            {pct !== null ? (
                              <>
                                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-amber-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <div className="mt-1.5 flex items-baseline justify-between text-xs">
                                  <span className="font-display text-sm">{formatMoney(campaign.raised)}</span>
                                  <span className="text-muted-foreground">
                                    {pct}% · {campaign.donors} donors
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  {campaign.donors.toLocaleString()} supporters
                                </span>
                                {campaign.frequencies && (
                                  <span className="font-medium text-amber-600">
                                    {campaign.frequencies.slice(0, 2).join(" · ")}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "orgs" && !isGlobalEmpty && (
          <>
            {orgsLoading ? (
              <PageSpinner label="Loading organizations..." fullScreen={false} />
            ) : orgs.length === 0 ? (
              <DiscoverEmptyState
                title="No organizations found"
                body={
                  search
                    ? "Try a different search term."
                    : "No organizations have been registered yet. The first ministry, church, or school profile will appear here."
                }
                primaryHref="/register-org"
                primaryLabel="Register an organization"
              />
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {orgs.map((org) => (
                  <Link key={org.id} to="/org/$id" params={{ id: org.id }} className="group block">
                    <article className="overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-amber-200 hover:shadow-md">
                      <div className="aspect-[16/10] overflow-hidden bg-muted">
                        {org.photos[0] ? (
                          <img
                            src={org.photos[0]}
                            alt=""
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">
                            No image yet
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                            {orgCategoryIcon[org.category]} {org.category}
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
                        <div className="mt-4 flex items-center justify-between text-xs">
                          <span>{formatMoney(org.totalReceived)} received</span>
                          <span className="text-muted-foreground">{org.campaignCount} campaigns</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
