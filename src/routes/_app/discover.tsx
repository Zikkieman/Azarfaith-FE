import placeholderCover from "@/assets/placeholder-cover.svg";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, MapPin, Search } from "lucide-react";
import { Photo } from "@/components/app/Photo";
import { DiscoverSkeleton } from "@/components/app/Skeletons";
import { pending, simulateNetwork } from "@/lib/api";
import {
  AppShell,
  Container,
  EmptyState,
  PageHeader,
  Tabs,
  VerifiedBadge,
  inputClass,
} from "@/components/app/AppShell";
import { btnSecondary } from "@/components/app/btn";
import { CampaignCard } from "@/components/CampaignCard";
import { useApp } from "@/lib/store";
import { categories, formatCompactMoney, type Org } from "@/lib/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/discover")({
  loader: () => simulateNetwork(),
  pendingComponent: DiscoverSkeleton,
  ...pending,
  head: () => ({ meta: [{ title: "Discover causes — AzarFaith" }] }),
  component: Discover,
});

const orgCategoryLabel: Record<Org["category"], string> = {
  church: "Church",
  mission: "Mission",
  orphanage: "Orphanage",
  school: "School",
  other: "Ministry",
};

type Tab = "all" | "ongoing" | "one-time" | "orgs";

function Discover() {
  const campaigns = useApp((s) => s.campaigns);
  const orgs = useApp((s) => s.orgs);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const q = search.trim().toLowerCase();

  const shownCampaigns = campaigns.filter(
    (c) =>
      (tab === "all" || tab === c.mode) &&
      (!category || c.faithCategory === category) &&
      (!q ||
        c.title.toLowerCase().includes(q) ||
        c.story.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)),
  );
  const shownOrgs = orgs.filter(
    (o) =>
      !q ||
      o.name.toLowerCase().includes(q) ||
      o.location.toLowerCase().includes(q) ||
      o.denomination.toLowerCase().includes(q),
  );

  const clearAll = () => {
    setSearch("");
    setCategory("");
    setTab("all");
  };

  return (
    <AppShell>
      <PageHeader
        title="Discover causes"
        lead="Churches, missions, orphanages and schools. Every organization is checked before it can receive gifts."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1 sm:max-w-[420px]">
            <span className="sr-only">Search</span>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-ink"
              strokeWidth={1.75}
            />
            <input
              className={cn(inputClass, "pl-10")}
              placeholder="Search causes, organizations or places"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          {tab !== "orgs" ? (
            <label className="relative sm:w-[240px]">
              <span className="sr-only">Cause</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={cn(inputClass, "cursor-pointer appearance-none pr-10")}
              >
                <option value="">All causes</option>
                {categories.map(({ label }) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink"
                strokeWidth={2}
              />
            </label>
          ) : null}
        </div>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "all", label: "All campaigns", count: campaigns.length },
            {
              value: "ongoing",
              label: "Ongoing",
              count: campaigns.filter((c) => c.mode === "ongoing").length,
            },
            {
              value: "one-time",
              label: "One-time",
              count: campaigns.filter((c) => c.mode === "one-time").length,
            },
            { value: "orgs", label: "Organizations", count: orgs.length },
          ]}
        />
      </PageHeader>

      <Container className="py-10 md:py-14">
        {tab !== "orgs" ? (
          shownCampaigns.length === 0 ? (
            <EmptyState
              icon={<Search className="h-5 w-5" strokeWidth={1.5} />}
              title="No campaigns match"
              body="Try a different search or cause, or clear the filters to see everything."
              action={
                <button type="button" onClick={clearAll} className={btnSecondary}>
                  Clear filters
                </button>
              }
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {shownCampaigns.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          )
        ) : shownOrgs.length === 0 ? (
          <EmptyState
            icon={<Search className="h-5 w-5" strokeWidth={1.5} />}
            title="No organizations match"
            body="Try a different search, or clear it to see everything."
            action={
              <button type="button" onClick={() => setSearch("")} className={btnSecondary}>
                Clear search
              </button>
            }
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {shownOrgs.map((org) => (
              <OrgCard key={org.id} org={org} />
            ))}
          </div>
        )}
      </Container>
    </AppShell>
  );
}

/** Organization card, built like the campaign card: clean photo, then who, what and where. */
function OrgCard({ org }: { org: Org }) {
  return (
    <Link
      to="/org/$id"
      params={{ id: org.id }}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-line-soft bg-paper font-gsf transition-colors hover:border-line"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Photo
          src={org.photos[0] ?? placeholderCover}
          className="absolute inset-0 bg-panel"
          imgClassName="halftone group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <p className="flex items-center gap-3 text-[13px] text-muted-ink">
          {orgCategoryLabel[org.category]}
          {org.verificationStatus === "verified" ? <VerifiedBadge /> : null}
        </p>
        <h3 className="text-[18px] font-semibold leading-[24px] tracking-[-0.01em] text-heading group-hover:underline">
          {org.name}
        </h3>
        <p className="line-clamp-2 text-sm leading-5 text-ink-soft">{org.tagline}</p>
        <p className="flex items-center gap-1.5 pt-1 text-[13px] text-muted-ink">
          <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} /> {org.location}
        </p>
        <p className="mt-auto flex gap-6 border-t border-line-soft pt-4 text-[13px] text-muted-ink">
          <span>
            <span className="text-[15px] font-semibold text-heading">
              {formatCompactMoney(org.totalReceived)}
            </span>{" "}
            received
          </span>
          <span>
            <span className="text-[15px] font-semibold text-heading">
              {org.supporters.toLocaleString()}
            </span>{" "}
            givers
          </span>
        </p>
      </div>
    </Link>
  );
}
