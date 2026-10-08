import { createFileRoute, Link } from "@tanstack/react-router";
import { Photo } from "@/components/app/Photo";
import { DiscoverSkeleton } from "@/components/app/Skeletons";
import { pending, simulateNetwork } from "@/lib/api";
import { useState } from "react";
import { Search, MapPin, Church, Globe, Baby, GraduationCap, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  AppShell,
  Container,
  EmptyState,
  PageHeader,
  Pill,
  btnSecondary,
} from "@/components/app/AppShell";
import { CampaignCard } from "@/components/CampaignCard";
import iconVerified from "@/assets/landing/icon-verified.svg";
import { useApp } from "@/lib/store";
import { formatMoney, categories, type Org } from "@/lib/mock";

export const Route = createFileRoute("/_app/discover")({
  loader: () => simulateNetwork(),
  pendingComponent: DiscoverSkeleton,
  ...pending,
  head: () => ({ meta: [{ title: "Discover causes — AzarFaith" }] }),
  component: AzarFaithDiscover,
});

const orgCategoryIcon: Record<Org["category"], LucideIcon> = {
  church: Church,
  mission: Globe,
  orphanage: Baby,
  school: GraduationCap,
  other: Users,
};

const fallbackCover =
  "https://images.unsplash.com/photo-1532635241-17e820acc59f?auto=format&fit=crop&w=1200&q=80";

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
    { v: "orgs", label: "Organizations", count: orgs.length },
  ];

  const clearAll = () => {
    setSearch("");
    setCategoryFilter(null);
    setTab("all");
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Discover"
        title="Discover AzarFaith causes"
        lead="Find missionaries, churches, orphanages, and schools to support — every organization is reviewed before it can receive gifts."
        actions={
          <label className="flex w-full items-center gap-2 border-b border-line-strong pb-2.5 lg:w-[360px]">
            <Search className="h-[18px] w-[18px] shrink-0 text-ink-soft" strokeWidth={1.5} />
            <span className="sr-only">Search</span>
            <input
              className="w-full bg-transparent font-gsf text-base text-ink placeholder:text-subtle focus:outline-none"
              placeholder="Search causes, orgs or places"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="-mx-6 flex items-center gap-2.5 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
            {tabs.map(({ v, label, count }) => (
              <Pill key={v} active={tab === v} count={count} onClick={() => setTab(v)}>
                {label}
              </Pill>
            ))}
          </div>

          {tab !== "orgs" ? (
            <div className="-mx-6 flex items-center gap-2 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
              <CategoryChip active={!categoryFilter} onClick={() => setCategoryFilter(null)}>
                All categories
              </CategoryChip>
              {categories.map(({ label, icon: Icon }) => (
                <CategoryChip
                  key={label}
                  active={categoryFilter === label}
                  onClick={() => setCategoryFilter(categoryFilter === label ? null : label)}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.5} /> {label}
                </CategoryChip>
              ))}
            </div>
          ) : null}
        </div>
      </PageHeader>

      <Container className="py-12 md:py-16">
        {tab !== "orgs" ? (
          filteredCampaigns.length === 0 ? (
            <EmptyState
              icon={<Search className="h-5 w-5" strokeWidth={1.5} />}
              title="No campaigns match your filters"
              body="Try a different search term or category, or clear your filters to see everything."
              action={
                <button type="button" onClick={clearAll} className={btnSecondary}>
                  Clear filters
                </button>
              }
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredCampaigns.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          )
        ) : filteredOrgs.length === 0 ? (
          <EmptyState
            icon={<Search className="h-5 w-5" strokeWidth={1.5} />}
            title="No organizations match your search"
            body="Try a different search term, or clear your search to see everything."
            action={
              <button type="button" onClick={() => setSearch("")} className={btnSecondary}>
                Clear search
              </button>
            }
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredOrgs.map((org) => (
              <OrgCard key={org.id} org={org} />
            ))}
          </div>
        )}
      </Container>
    </AppShell>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 font-gsf text-[13px] font-medium leading-5 transition-colors ${
        active ? "bg-[#FFE228] text-[#130E30]" : "bg-panel text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function OrgCard({ org }: { org: Org }) {
  const Icon = orgCategoryIcon[org.category];
  return (
    <Link
      to="/org/$id"
      params={{ id: org.id }}
      className="group flex flex-col rounded-xl border border-line-soft bg-paper p-6 transition-colors hover:border-line"
    >
      <div className="relative h-[200px] w-full overflow-hidden rounded-lg">
        <Photo
          src={org.photos[0] ?? fallbackCover}
          className="absolute inset-0"
          imgClassName="transition duration-500 group-hover:scale-[1.02]"
        />
        <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-[25px] bg-[#F8F8F8]/80 px-2 py-1 text-sm leading-5 text-black">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.5} /> {orgCategoryLabel[org.category]}
        </span>
        {org.verificationStatus === "verified" ? (
          <span className="absolute bottom-3.5 left-2 flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-0.5">
            <img src={iconVerified} alt="" className="h-4 w-4" />
            <span className="text-xs font-medium leading-4 text-[#6B6B6B]">Verified</span>
          </span>
        ) : null}
      </div>
      <h3 className="pt-5 font-gsf text-lg font-semibold leading-[27px] text-heading">
        {org.name}
      </h3>
      <p className="line-clamp-2 text-sm leading-5 text-muted-ink">{org.tagline}</p>
      <p className="flex items-center gap-1.5 pt-2 text-sm leading-5 text-muted-ink">
        <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} /> {org.location}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line-soft pt-4">
        <div>
          <p className="text-base font-semibold text-ink">{formatMoney(org.totalReceived)}</p>
          <p className="text-[13px] text-muted-ink">received</p>
        </div>
        <div>
          <p className="text-base font-semibold text-ink">{org.supporters.toLocaleString()}</p>
          <p className="text-[13px] text-muted-ink">supporters</p>
        </div>
      </div>
    </Link>
  );
}
