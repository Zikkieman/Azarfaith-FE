import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { discoverCampaigns, discoverOrganizations } from "@/features/catalog/api";
import { faithCategoryOptions, orgCategoryOptions } from "@/lib/catalog";
import type { DiscoverySort, DiscoveryView } from "@/lib/discovery";
import { useClientReady } from "@/lib/useClientReady";
import { PageSpinner } from "@/components/PageSpinner";
import { PublicShell, CatalogError } from "@/components/public/PublicShell";
import { CampaignCard, OrganizationCard } from "@/components/public/CatalogCards";
import { DiscoveryShelves } from "@/components/public/DiscoveryShelves";

export const Route = createFileRoute("/discover")({ component: Discover });

const views: Array<{ value: DiscoveryView | "orgs"; label: string }> = [
  { value: "all", label: "All causes" },
  { value: "urgent", label: "Urgent needs" },
  { value: "nearly", label: "Nearly funded" },
  { value: "regular", label: "Ongoing support" },
  { value: "new", label: "New this month" },
  { value: "one-time", label: "One-time" },
  { value: "orgs", label: "Organizations" },
];

function Discover() {
  const ready = useClientReady();
  const [view, setView] = useState<DiscoveryView | "orgs">("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<DiscoverySort>("urgent");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search.trim());
  const filters = { search: deferredSearch, category, sort, page, view };
  const organizations = filters.view === "orgs";
  const campaignQuery = useQuery({
    queryKey: ["campaigns", "discover", filters],
    queryFn: () =>
      discoverCampaigns({
        view: filters.view === "orgs" ? "all" : filters.view,
        search: filters.search || undefined,
        faithCategory: filters.category || undefined,
        sort: filters.sort,
        page: filters.page,
      }),
    enabled: ready && !organizations,
  });
  const orgQuery = useQuery({
    queryKey: ["organizations", "discover", filters.search, filters.category, filters.page],
    queryFn: () =>
      discoverOrganizations({
        search: filters.search || undefined,
        category: filters.category || undefined,
        page: filters.page,
      }),
    enabled: ready && organizations,
  });
  const query = organizations ? orgQuery : campaignQuery;
  const data = query.data;
  const categories = view === "orgs" ? orgCategoryOptions : faithCategoryOptions;
  const changeView = (next: typeof view) => {
    setView(next);
    setCategory("");
    setPage(1);
  };
  return (
    <PublicShell>
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
            Find your next cause
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Discover</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Support verified ministries, communities and people doing meaningful work across
            Nigeria.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
          Approved causes. Real impact.
        </span>
      </header>
      <div className="relative mt-8">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          aria-label="Search causes"
          className="public-input py-4 pl-12"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search causes, organizations or locations"
        />
      </div>
      <div role="group" aria-label="Browse causes" className="mt-6 flex gap-2 overflow-x-auto pb-3">
        {views.map((item) => (
          <button
            key={item.value}
            aria-pressed={view === item.value}
            onClick={() => changeView(item.value)}
            className={`shrink-0 rounded-full px-4 py-3 text-sm font-medium transition ${view === item.value ? "bg-[#130e30] text-white" : "bg-stone-50 text-muted-foreground hover:bg-stone-100"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        role="group"
        aria-label="Filter by category"
        className="mt-3 flex gap-3 overflow-x-auto border-b border-stone-100 pb-5"
      >
        <button
          aria-pressed={!category}
          onClick={() => {
            setCategory("");
            setPage(1);
          }}
          className={`shrink-0 rounded-lg px-3 py-2 text-xs ${!category ? "bg-orange-50 text-orange-700" : "text-muted-foreground"}`}
        >
          All categories
        </button>
        {categories.map((item) => (
          <button
            key={item.value}
            aria-pressed={category === item.value}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs ${category === item.value ? "bg-orange-50 text-orange-700" : "text-muted-foreground"}`}
            onClick={() => {
              setCategory(item.value);
              setPage(1);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {ready && view === "all" && !search.trim() && !category && page === 1 && (
        <DiscoveryShelves onView={changeView} />
      )}
      <div className="my-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">
          {views.find((item) => item.value === view)?.label}
          {data && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">({data.total})</span>
          )}
        </h2>
        {view !== "orgs" && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Sort by
            <select
              aria-label="Sort campaigns"
              className="rounded-lg border border-stone-200 bg-white p-2 text-sm text-foreground"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as DiscoverySort);
                setPage(1);
              }}
            >
              <option value="urgent">Most urgent</option>
              <option value="nearly">Closest to goal</option>
              <option value="newest">Newest</option>
              <option value="givers">Most supporters</option>
            </select>
          </label>
        )}
      </div>
      {!ready || query.isPending ? (
        <PageSpinner fullScreen={false} label="Finding causes" />
      ) : query.isError ? (
        <CatalogError
          retry={() => {
            void query.refetch();
          }}
        />
      ) : data?.items.length ? (
        <>
          <div aria-busy={query.isFetching} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {organizations
              ? orgQuery.data?.items.map((org) => (
                  <OrganizationCard key={org.id} organization={org} />
                ))
              : campaignQuery.data?.items.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
          </div>
          <div className="mt-8 flex items-center justify-between">
            <button
              disabled={page === 1}
              className="public-button-outline disabled:opacity-40"
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {data.page} of {Math.max(1, Math.ceil(data.total / data.pageSize))}
            </span>
            <button
              disabled={!data.hasMore}
              className="public-button-outline disabled:opacity-40"
              onClick={() => setPage((current) => current + 1)}
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      ) : (
        <div className="public-panel py-16 text-center">
          <h3 className="text-xl font-semibold">No causes found</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            {search || category
              ? "Try another search or clear your filters."
              : "New approved causes will appear here as they are published."}
          </p>
          <button
            onClick={() => {
              setSearch("");
              setCategory("");
              changeView("all");
            }}
            className="public-button-outline mt-5"
          >
            Reset filters
          </button>
        </div>
      )}
    </PublicShell>
  );
}
