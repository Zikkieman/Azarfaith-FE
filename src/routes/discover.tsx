import { useDeferredValue, useRef, useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  LayoutGrid,
  MapPin,
  Repeat2,
  Search,
  Target,
  X,
} from "lucide-react";
import placeholderCover from "@/assets/placeholder-cover.svg";
import { Photo } from "@/components/app/Photo";
import { Segments } from "@/components/app/Segments";
import { PageSpinner } from "@/components/PageSpinner";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/app/hooks";
import { discoverCampaigns, discoverOrganizations } from "@/features/catalog/api";
import { useClientReady } from "@/lib/useClientReady";
import { discoveryCategory, isPublished } from "@/lib/discovery";
import { ApiError } from "@/lib/api";
import { AppShell, Container, EmptyState, VerifiedBadge } from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import { CampaignCard } from "@/components/app/CampaignCard";
import type { Campaign, Org } from "@/lib/catalog";
import { categories } from "@/components/app/discovery-categories";
import { formatCompactMoney } from "@/components/landing/design-preview";
import { cn } from "@/lib/utils";

const views = ["all", "urgent", "nearly", "regular", "new", "orgs", "one-time"] as const;
type View = (typeof views)[number];
type Sort = "urgent" | "nearly" | "newest" | "givers";

export const Route = createFileRoute("/discover")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { view?: View; cause?: string; q?: string; page?: number } => ({
    view: views.includes(s.view as View) ? (s.view as View) : undefined,
    cause: typeof s.cause === "string" ? s.cause : undefined,
    page: Number.isSafeInteger(Number(s.page)) && Number(s.page) > 1 ? Number(s.page) : undefined,
    q: typeof s.q === "string" && s.q ? s.q : undefined,
  }),
  head: () => ({ meta: [{ title: "Discover causes — AzarFaith" }] }),
  component: Discover,
});

const pct = (c: Campaign) => (c.goal ? c.raised / c.goal : 0);
const urgency = (c: Campaign) =>
  c.type === "emergency" ? 4 : ["low", "medium", "high", "critical"].indexOf(c.urgency);
const isUrgent = (c: Campaign) => urgency(c) >= 2;

const quick: { value: View; label: string; icon: LucideIcon }[] = [
  { value: "all", label: "All", icon: LayoutGrid },
  { value: "urgent", label: "Urgent now", icon: Flame },
  { value: "nearly", label: "Nearly there", icon: Target },
  { value: "regular", label: "Give regularly", icon: Repeat2 },
  { value: "new", label: "New", icon: Clock },
  { value: "orgs", label: "Organizations", icon: Building2 },
];

/**
 * Discover (after Uppbeat and GlideOS): search first, quick views, cause tabs with icons, a featured
 * carousel and shelves while browsing; a sortable grid once you search or filter.
 */
function Discover() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const ready = useClientReady();
  const userId = useAppSelector((state) => state.auth.user?.id ?? null);
  const [sort, setSort] = useState<Sort>("urgent");
  const view = search.view ?? "all";
  const cause = search.cause;
  const q = useDeferredValue((search.q ?? "").trim());
  const page = search.page ?? 1;
  const browsing = view === "all" && !cause && !q && page === 1;
  const set = (patch: Partial<typeof search>) =>
    navigate({
      to: "/discover",
      search: { ...search, ...patch, page: "page" in patch ? patch.page : undefined },
      replace: true,
    });
  const clear = () => navigate({ to: "/discover", search: {}, replace: true });
  const retry = (attempt: number, error: Error) =>
    !(error instanceof ApiError && [400, 401, 403, 404].includes(error.status)) && attempt < 1;
  const resultsQuery = useQuery({
    queryKey: ["campaigns", "designer-discover", userId, view, cause, q, sort, page],
    queryFn: () =>
      discoverCampaigns({
        view: view === "orgs" ? "all" : view,
        faithCategory: discoveryCategory(cause),
        search: q || undefined,
        sort,
        page,
      }),
    enabled: ready && !browsing && view !== "orgs",
    retry,
  });
  const orgQuery = useQuery({
    queryKey: ["organizations", "designer-discover", userId, q, page],
    queryFn: () => discoverOrganizations({ search: q || undefined, page }),
    enabled: ready && view === "orgs",
    retry,
  });
  const urgent = useQuery({
    queryKey: ["campaigns", "designer-shelf", userId, "urgent"],
    queryFn: () => discoverCampaigns({ view: "urgent", pageSize: 8 }),
    enabled: ready && browsing,
    retry,
  });
  const nearly = useQuery({
    queryKey: ["campaigns", "designer-shelf", userId, "nearly"],
    queryFn: () => discoverCampaigns({ view: "nearly", sort: "nearly", pageSize: 8 }),
    enabled: ready && browsing,
    retry,
  });
  const regular = useQuery({
    queryKey: ["campaigns", "designer-shelf", userId, "regular"],
    queryFn: () => discoverCampaigns({ view: "regular", sort: "newest", pageSize: 8 }),
    enabled: ready && browsing,
    retry,
  });
  const organizationShelf = useQuery({
    queryKey: ["organizations", "designer-shelf", userId],
    queryFn: () => discoverOrganizations({ pageSize: 6 }),
    enabled: ready && browsing,
    retry,
  });
  const results = resultsQuery.data?.items.filter(isPublished) ?? [];
  const orgResults = orgQuery.data?.items.filter(isPublished) ?? [];
  const orgs = organizationShelf.data?.items.filter(isPublished) ?? [];
  const query = view === "orgs" ? orgQuery : resultsQuery;
  const shelves = [urgent, nearly, regular, organizationShelf];

  return (
    <AppShell>
      <Container className="flex flex-col gap-8 py-8 md:py-12">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-[clamp(30px,3vw,44px)] leading-[1.08] tracking-[-0.03em] text-ink">
              Discover
            </h1>
            <p className="text-[15px] text-ink-soft">
              Verified churches, missions, orphanages and schools across Nigeria.
            </p>
          </div>
          <SearchBox value={search.q ?? ""} onChange={(v) => set({ q: v || undefined })} />
          <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
            {quick.map((v) => (
              <button
                key={v.value}
                type="button"
                aria-pressed={view === v.value}
                onClick={() => set({ view: v.value === "all" ? undefined : v.value })}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-field border px-3.5 text-sm font-medium transition-colors",
                  view === v.value
                    ? "border-ink bg-ink text-ink-contrast"
                    : "border-line-soft bg-paper text-ink hover:border-line-input",
                )}
              >
                <v.icon className="h-4 w-4" strokeWidth={1.75} /> {v.label}
              </button>
            ))}
          </div>
          {view !== "orgs" ? <CauseTabs value={cause} onChange={(c) => set({ cause: c })} /> : null}
        </div>

        {!ready || (!browsing && query.isPending) ? (
          <PageSpinner fullScreen={false} label="Finding causes..." />
        ) : !browsing && query.isError ? (
          <DiscoveryError retry={() => void query.refetch()} />
        ) : view === "orgs" ? (
          <Results count={orgQuery.data?.total ?? orgResults.length} noun="organization">
            {orgResults.length ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {orgResults.map((o) => (
                  <OrgCard key={o.id} org={o} />
                ))}
              </div>
            ) : (
              <NoResults onClear={clear} />
            )}
          </Results>
        ) : browsing ? (
          <>
            {shelves.some((shelf) => shelf.isPending) ? (
              <PageSpinner fullScreen={false} label="Finding causes..." />
            ) : null}
            {shelves.some((shelf) => shelf.isError) ? (
              <DiscoveryError retry={() => shelves.forEach((shelf) => void shelf.refetch())} />
            ) : null}
            <Featured
              campaigns={(urgent.data?.items.filter(isPublished) ?? [])
                .filter((c) => c.goal && isUrgent(c))
                .slice(0, 3)}
            />
            <Shelf
              title="Urgent now"
              note="Emergencies and needs that can't wait"
              onSeeAll={() => set({ view: "urgent" })}
              items={urgent.data?.items.filter(isPublished) ?? []}
            />
            <Shelf
              title="Nearly there"
              note="Over halfway to their goal"
              onSeeAll={() => set({ view: "nearly" })}
              items={nearly.data?.items.filter(isPublished) ?? []}
            />
            <Shelf
              title="Give regularly"
              note="Monthly and weekly support for ongoing work"
              onSeeAll={() => set({ view: "regular" })}
              items={regular.data?.items.filter(isPublished) ?? []}
            />
            {orgs.length ? (
              <section className="flex flex-col gap-4">
                <ShelfHead title="Verified organizations" onSeeAll={() => set({ view: "orgs" })} />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {orgs
                    .filter((o) => o.verificationStatus === "verified")
                    .map((o) => (
                      <OrgRow key={o.id} org={o} />
                    ))}
                </div>
              </section>
            ) : null}
            {shelves.every((shelf) => shelf.isSuccess) &&
            !orgs.length &&
            !urgent.data?.items.length &&
            !nearly.data?.items.length &&
            !regular.data?.items.length ? (
              <NoResults onClear={clear} />
            ) : null}
          </>
        ) : (
          <Results
            count={resultsQuery.data?.total ?? results.length}
            noun="campaign"
            onClear={clear}
            sort={
              <label className="relative">
                <span className="sr-only">Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as Sort);
                    void set({ page: undefined });
                  }}
                  className="h-9 cursor-pointer appearance-none rounded-field border border-line-soft bg-paper pl-3 pr-9 text-sm text-ink focus:border-ink focus:outline-none"
                >
                  <option value="urgent">Most urgent</option>
                  <option value="nearly">Nearly there</option>
                  <option value="newest">Newest</option>
                  <option value="givers">Most givers</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink"
                  strokeWidth={2}
                />
              </label>
            }
          >
            {results.length ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {results.map((c) => (
                  <CampaignCard key={c.id} campaign={c} />
                ))}
              </div>
            ) : (
              <NoResults onClear={clear} />
            )}
          </Results>
        )}
        {!browsing && query.data && query.data.total > query.data.pageSize ? (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={page <= 1}
              className={btn("secondary", "sm")}
              onClick={() => void set({ page: page - 1 })}
            >
              Previous
            </button>
            <span className="text-[13px] text-muted-ink">
              Page {page} of {Math.max(1, Math.ceil(query.data.total / query.data.pageSize))}
            </span>
            <button
              type="button"
              disabled={!query.data.hasMore}
              className={btn("secondary", "sm")}
              onClick={() => void set({ page: page + 1 })}
            >
              Next
            </button>
          </div>
        ) : null}
      </Container>
    </AppShell>
  );
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="relative block max-w-[640px]">
      <span className="sr-only">Search causes</span>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-ink"
        strokeWidth={1.75}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search a church, a mission, a town or a need"
        className="h-12 w-full rounded-full border border-line-input bg-paper pl-12 pr-11 font-gsf text-[15px] text-ink transition-colors placeholder:text-subtle focus:border-ink focus:outline-none"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted-ink hover:bg-panel hover:text-ink"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      ) : null}
    </label>
  );
}

/** Causes as icon tabs (after Uppbeat's genre row). */
function CauseTabs({ value, onChange }: { value?: string; onChange: (c?: string) => void }) {
  const items: { label: string; value?: string; icon: LucideIcon }[] = [
    { label: "All causes", icon: LayoutGrid },
    ...categories.map((c) => ({ label: c.label, value: c.label, icon: c.icon })),
  ];
  return (
    <div
      role="tablist"
      className="-mx-6 flex gap-1 overflow-x-auto border-b border-line-soft px-6 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.label}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cn(
              "-mb-px flex shrink-0 flex-col items-center gap-1.5 border-b-2 px-3 pb-3 pt-1 text-[12px] font-medium transition-colors",
              active ? "border-ink text-ink" : "border-transparent text-muted-ink hover:text-ink",
            )}
          >
            <it.icon className="h-5 w-5" strokeWidth={1.5} />
            <span className="whitespace-nowrap">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** A large feature (after GlideOS's App Store hero). It moves only when asked. */
function Featured({ campaigns }: { campaigns: Campaign[] }) {
  const [i, setI] = useState(0);
  if (!campaigns.length) return null;
  const c = campaigns[i % campaigns.length];
  const progress = Math.round(pct(c) * 100);
  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured campaigns"
      className="relative overflow-hidden rounded-card bg-panel"
    >
      <div key={c.id} className="admin-rise grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col justify-center gap-4 p-6 pb-16 sm:p-8 sm:pb-16 lg:p-10 lg:pb-16">
          <p className="text-[13px] font-medium text-brand-ink">Featured</p>
          <h2 className="font-display text-[clamp(24px,2.4vw,34px)] leading-[1.15] tracking-[-0.02em] text-ink">
            {c.title}
          </h2>
          <p className="line-clamp-3 text-[15px] leading-[1.6] text-ink-soft">{c.story}</p>
          <div className="flex max-w-[360px] flex-col gap-2">
            <Segments pct={progress} />
            <p className="text-[13px] text-muted-ink">
              <span className="font-semibold text-ink">{formatCompactMoney(c.raised)}</span> of{" "}
              {formatCompactMoney(c.goal ?? 0)}, {c.donors.toLocaleString()} givers
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              to="/donate/$id"
              params={{ id: c.id }}
              search={{ freq: "" }}
              className={btn("primary")}
            >
              Give now
            </Link>
            <Link to="/campaign/$id" params={{ id: c.id }} className={btn("secondary")}>
              Read the story
            </Link>
          </div>
        </div>
        <Photo
          src={c.cover}
          className="order-first aspect-[16/10] md:order-none md:aspect-auto md:min-h-[380px]"
          imgClassName="halftone"
        />
      </div>
      {campaigns.length > 1 ? (
        <div className="absolute bottom-5 left-6 flex items-center gap-2 sm:left-8 lg:left-10">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => setI((i - 1 + campaigns.length) % campaigns.length)}
            className="grid h-8 w-8 place-items-center rounded-full bg-paper text-ink shadow-[0_1px_3px_rgba(19,14,48,0.12)]"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          {campaigns.map((x, j) => (
            <button
              key={x.id}
              type="button"
              aria-label={`Show ${x.title}`}
              aria-current={i === j}
              onClick={() => setI(j)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === j ? "w-6 bg-ink" : "w-1.5 bg-ink/25",
              )}
            />
          ))}
          <button
            type="button"
            aria-label="Next"
            onClick={() => setI((i + 1) % campaigns.length)}
            className="grid h-8 w-8 place-items-center rounded-full bg-paper text-ink shadow-[0_1px_3px_rgba(19,14,48,0.12)]"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      ) : null}
    </section>
  );
}

function ShelfHead({
  title,
  note,
  onSeeAll,
}: {
  title: string;
  note?: string;
  onSeeAll: () => void;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-[22px] leading-tight tracking-[-0.02em] text-ink">
          {title}
        </h2>
        {note ? <p className="text-sm text-muted-ink">{note}</p> : null}
      </div>
      <button
        type="button"
        onClick={onSeeAll}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
      >
        See all <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}

/** A horizontal row of campaigns (after Uppbeat's shelves), with arrows on wide screens. */
function Shelf({
  title,
  note,
  items,
  onSeeAll,
}: {
  title: string;
  note?: string;
  items: Campaign[];
  onSeeAll: () => void;
}) {
  const row = useRef<HTMLDivElement>(null);
  if (!items.length) return null;
  const scroll = (d: number) =>
    row.current?.scrollBy({ left: d * row.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <section className="flex flex-col gap-4">
      <ShelfHead title={title} note={note} onSeeAll={onSeeAll} />
      <div className="relative">
        <div
          ref={row}
          className="-mx-6 flex snap-x gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {items.map((c) => (
            <div key={c.id} className="w-[min(320px,82vw)] shrink-0 snap-start">
              <CampaignCard campaign={c} />
            </div>
          ))}
        </div>
        {items.length > 3 ? (
          <>
            <ShelfArrow side="left" onClick={() => scroll(-1)} />
            <ShelfArrow side="right" onClick={() => scroll(1)} />
          </>
        ) : null}
      </div>
    </section>
  );
}

function ShelfArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Scroll back" : "Scroll forward"}
      onClick={onClick}
      className={cn(
        "absolute top-[30%] hidden h-10 w-10 place-items-center rounded-full border border-line-soft bg-paper text-ink shadow-[0_4px_16px_-4px_rgba(19,14,48,0.2)] transition-colors hover:bg-panel lg:grid",
        side === "left" ? "-left-5" : "-right-5",
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}

function Results({
  count,
  noun,
  sort,
  onClear,
  children,
}: {
  count: number;
  noun: string;
  sort?: ReactNode;
  onClear?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-ink-soft">
          <span className="font-semibold text-ink">{count}</span> {count === 1 ? noun : `${noun}s`}
          {onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="ml-3 text-muted-ink underline underline-offset-2 hover:text-ink"
            >
              Clear filters
            </button>
          ) : null}
        </p>
        {sort}
      </div>
      {children}
    </section>
  );
}

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      icon={<Search className="h-5 w-5" strokeWidth={1.5} />}
      title="Nothing matches yet"
      body="Try another word, a nearby town or a different cause."
      action={
        <button type="button" onClick={onClear} className={btn("secondary")}>
          Clear search and filters
        </button>
      }
    />
  );
}

/** Compact organization row for the browse shelf (after GlideOS's app list). */
function OrgRow({ org }: { org: Org }) {
  return (
    <Link
      to="/org/$id"
      params={{ id: org.id }}
      className="group flex items-center gap-3 rounded-card border border-line-soft p-3 transition-colors hover:border-line-input"
    >
      <img
        src={org.photos[0] ?? placeholderCover}
        alt=""
        className="h-14 w-14 shrink-0 rounded-field object-cover"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[15px] font-semibold text-ink">
          <span className="truncate">{org.name}</span>
          <VerifiedBadge label={null} />
        </span>
        <span className="line-clamp-1 text-[13px] text-muted-ink">{org.tagline}</span>
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-muted-ink transition-transform group-hover:translate-x-0.5"
        strokeWidth={2}
      />
    </Link>
  );
}

const orgCategoryLabel: Record<Org["category"], string> = {
  church: "Church",
  mission: "Mission",
  orphanage: "Orphanage",
  school: "School",
  other: "Ministry",
};

function OrgCard({ org }: { org: Org }) {
  return (
    <Link
      to="/org/$id"
      params={{ id: org.id }}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-line-soft bg-paper transition-colors hover:border-line"
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
        <h3 className="text-[18px] font-semibold leading-[24px] text-heading group-hover:underline">
          {org.name}
        </h3>
        <p className="line-clamp-2 text-sm text-ink-soft">{org.tagline}</p>
        <p className="mt-auto flex items-center gap-1.5 pt-3 text-[13px] text-muted-ink">
          <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} /> {org.location}
        </p>
      </div>
    </Link>
  );
}

function DiscoveryError({ retry }: { retry: () => void }) {
  return (
    <section
      role="alert"
      className="flex flex-col items-start gap-3 rounded-card border border-line-soft p-5"
    >
      <p className="text-sm text-ink-soft">Some causes couldn't load. Please try again.</p>
      <button type="button" className={btn("secondary", "sm")} onClick={retry}>
        Retry
      </button>
    </section>
  );
}
