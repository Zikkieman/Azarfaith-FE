import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  ShieldCheck,
  MapPin,
  Church,
  Globe,
  Baby,
  GraduationCap,
  Users,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { CampaignCard } from "@/components/CampaignCard";
import { useApp } from "@/lib/store";
import { formatMoney, categories } from "@/lib/mock";

export const Route = createFileRoute("/discover")({
  component: AzarFaithDiscover,
});

const orgCategoryIcon: Record<string, React.ReactNode> = {
  church: <Church className="w-4 h-4" />,
  mission: <Globe className="w-4 h-4" />,
  orphanage: <Baby className="w-4 h-4" />,
  school: <GraduationCap className="w-4 h-4" />,
  other: <Users className="w-4 h-4" />,
};

const orgCategoryLabel: Record<string, string> = {
  church: "Church",
  mission: "Mission",
  orphanage: "Orphanage",
  school: "School",
  other: "Ministry",
};

type Tab = "all" | "ongoing" | "one-time" | "orgs";

function AzarFaithDiscover() {
  const { campaigns, orgs } = useApp();
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const filteredCampaigns = campaigns.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.story.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q);
    const matchesTab = tab === "all" || tab === c.mode;
    const matchesCategory = !categoryFilter || c.faithCategory === categoryFilter;
    return matchesSearch && matchesTab && matchesCategory;
  });

  const filteredOrgs = orgs.filter((o) => {
    const q = search.toLowerCase();
    return (
      !q ||
      o.name.toLowerCase().includes(q) ||
      o.location.toLowerCase().includes(q) ||
      o.denomination.toLowerCase().includes(q)
    );
  });

  const tabs: { v: Tab; label: string; count: number }[] = [
    { v: "all", label: "All campaigns", count: campaigns.length },
    { v: "ongoing", label: "Ongoing", count: campaigns.filter((c) => c.mode === "ongoing").length },
    {
      v: "one-time",
      label: "One time",
      count: campaigns.filter((c) => c.mode === "one-time").length,
    },
    { v: "orgs", label: "Organization", count: orgs.length },
  ];

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />

      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
            <div className="flex max-w-xl flex-col gap-6">
              <h1 className="font-display text-4xl tracking-tight text-[#232323] sm:text-5xl">
                Discover AzarFaith causes
              </h1>
              <p className="text-sm text-[#232323]">
                Find missionaries, churches, orphanages, and schools to support.
              </p>
            </div>
            <div className="flex w-full items-center gap-2 border-b border-[#8c8c8c] pb-2 lg:w-80">
              <Search className="h-4 w-4 shrink-0 text-[#8c8c8c]" />
              <input
                className="w-full bg-transparent text-sm text-[#232323] placeholder:text-[#8c8c8c] focus:outline-none"
                placeholder="Search campaigns, organizations, or locations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              {tabs.map(({ v, label, count }) => (
                <button
                  key={v}
                  onClick={() => setTab(v)}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-bold transition ${
                    tab === v ? "bg-[#667085] text-white" : "bg-[#cecece] text-[#667085]"
                  }`}
                >
                  {label}
                  <span
                    className={`rounded px-1 text-sm ${
                      tab === v ? "bg-[#344054] text-white" : "bg-white text-[#667085]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {tab !== "orgs" && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setCategoryFilter(null)}
                  className={`rounded px-3 py-1.5 text-xs font-bold transition ${
                    !categoryFilter ? "bg-[#fef3c6] text-[#bb4d00]" : "bg-[#f0f4f5] text-[#4e5a62]"
                  }`}
                >
                  All categories
                </button>
                {categories.map(({ label, icon }) => (
                  <button
                    key={label}
                    onClick={() => setCategoryFilter(categoryFilter === label ? null : label)}
                    className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition ${
                      categoryFilter === label
                        ? "bg-[#fef3c6] text-[#bb4d00]"
                        : "bg-[#f0f4f5] text-[#4e5a62]"
                    }`}
                  >
                    <span>{icon}</span> {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Campaigns grid */}
          {tab !== "orgs" && (
            <>
              {filteredCampaigns.length === 0 ? (
                <EmptyState
                  title="No campaigns match your filters"
                  body="Try a different search term or category, or clear your filters to see everything."
                  cta="Clear filters"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter(null);
                    setTab("all");
                  }}
                />
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCampaigns.map((c) => (
                    <CampaignCard key={c.id} campaign={c} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Orgs grid */}
          {tab === "orgs" && (
            <>
              {filteredOrgs.length === 0 ? (
                <EmptyState
                  title="No organizations match your search"
                  body="Try a different search term, or clear your search to see everything."
                  cta="Clear search"
                  onClick={() => setSearch("")}
                />
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredOrgs.map((org) => (
                    <Link
                      key={org.id}
                      to="/org/$id"
                      params={{ id: org.id }}
                      className="group block"
                    >
                      <article className="bg-card border border-border rounded-3xl overflow-hidden hover:border-amber-200 hover:shadow-md transition-all">
                        <div className="aspect-[16/9] overflow-hidden">
                          <img
                            src={
                              org.photos[0] ??
                              "https://images.unsplash.com/photo-1532635241-17e820acc59f?auto=format&fit=crop&w=1200&q=80"
                            }
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500"
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
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
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {org.tagline}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" /> {org.location}
                          </div>
                          <div className="mt-3 flex items-center gap-4 text-xs">
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  body,
  cta,
  onClick,
}: {
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3.5 rounded-lg bg-[#fff6f2] px-8 py-16 text-center">
      <p className="text-sm font-bold text-[#232323]">{title}</p>
      <p className="max-w-md text-sm text-[#232323]">{body}</p>
      <button onClick={onClick} className="text-sm font-medium text-[#232323] underline">
        {cta}
      </button>
    </div>
  );
}
