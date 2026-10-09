import { useMemo, useRef, useState, type ReactNode } from "react";
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
import { DiscoverSkeleton } from "@/components/app/Skeletons";
import { pending, simulateNetwork } from "@/lib/api";
import { AppShell, Container, EmptyState, VerifiedBadge } from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import { CampaignCard } from "@/components/CampaignCard";
import { useApp } from "@/lib/store";
import { categories, formatCompactMoney, type Campaign, type Category, type Org } from "@/lib/mock";
import { cn } from "@/lib/utils";

const views = ["all", "urgent", "nearly", "regular", "new", "orgs"] as const;
type View = (typeof views)[number];
type Sort = "urgent" | "nearly" | "newest" | "givers";

export const Route = createFileRoute("/_app/discover")({
  validateSearch: (s: Record<string, unknown>): { view?: View; cause?: string; q?: string } => ({
    view: views.includes(s.view as View) ? (s.view as View) : undefined,
    cause: typeof s.cause === "string" ? s.cause : undefined,
    q: typeof s.q === "string" && s.q ? s.q : undefined,
  }),
  loader: () => simulateNetwork(),
  pendingComponent: DiscoverSkeleton,
  ...pending,
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
  const allCampaigns = useApp((s) => s.campaigns);
  const orgs = useApp((s) => s.orgs);
  const [sort, setSort] = useState<Sort>("urgent");
  const view = search.view ?? "all";
  const cause = search.cause;
  const q = (search.q ?? "").trim().toLowerCase();

  const campaigns = useMemo(
    () => allCampaigns.filter((c) => c.verificationStatus !== "rejected"),
    [allCampaigns],
  );
  const set = (patch: Partial<typeof search>) =>
    navigate({ to: "/discover", search: { ...search, ...patch }, replace: true });
  const clear = () => navigate({ to: "/discover", search: {}, replace: true });

  const browsing = view === "all" && !cause && !q;

  const results = useMemo(() => {
    const list = campaigns.filter(
      (c) =>
        (view === "all" ||
          (view === "urgent" && isUrgent(c)) ||
          (view === "nearly" && pct(c) >= 0.5) ||
          (view === "regular" && c.mode === "ongoing") ||
          (view === "new" && c.createdAt >= "2025-05-01")) &&
        (!cause || c.faithCategory === cause) &&
        (!q ||
          [c.title, c.story, c.location, c.raiser.name].some((x) => x.toLowerCase().includes(q))),
    );
    const by: Record<Sort, (a: Campaign, b: Campaign) => number> = {
      urgent: (a, b) => urgency(b) - urgency(a),
      nearly: (a, b) => pct(b) - pct(a),
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      givers: (a, b) => b.donors - a.donors,
    };
    return [...list].sort(by[sort]);
  }, [campaigns, view, cause, q, sort]);

  const orgResults = orgs.filter(
    (o) => !q || [o.name, o.location, o.denomination].some((x) => x.toLowerCase().includes(q)),
  );

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

        {view === "orgs" ? (
          <Results count={orgResults.length} noun="organization">
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
            <Featured campaigns={campaigns.filter((c) => c.goal && isUrgent(c)).slice(0, 3)} />
            <Shelf
              title="Urgent now"
              note="Emergencies and needs that can't wait"
              onSeeAll={() => set({ view: "urgent" })}
              items={campaigns.filter(isUrgent)}
            />
            <Shelf
              title="Nearly there"
              note="Over halfway to their goal"
              onSeeAll={() => set({ view: "nearly" })}
              items={campaigns.filter((c) => pct(c) >= 0.5)}
            />
            <Shelf
              title="Give regularly"
              note="Monthly and weekly support for ongoing work"
              onSeeAll={() => set({ view: "regular" })}
              items={campaigns.filter((c) => c.mode === "ongoing")}
            />
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
          </>
        ) : (
          <Results
            count={results.length}
            noun="campaign"
            onClear={clear}
            sort={
              <label className="relative">
                <span className="sr-only">Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
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
  const items: { label: string; value?: Category; icon: LucideIcon }[] = [
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
  const c = campaigns[i];
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
            <Link to="/campaign/$id" params={{ id: c.id }} className={btn("primary")}>
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
