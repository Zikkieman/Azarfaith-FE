import { memo, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, MapPin, ReceiptText } from "lucide-react";
import { SiteNav } from "@/components/landing/SiteNav";
import { Footer } from "@/components/landing/Footer";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Cta } from "@/components/landing/Cta";
import { CountUp, Reveal } from "@/components/motion/Reveal";
import { campaignLayers } from "@/components/story/layers";
import { formatCompactMoney, formatMoney } from "@/lib/mock";
import { reducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { VIEW, dots, project, stateAt, states, type Dot } from "./nigeria";
import { causeLabel, feed, orgCount, stats, totals, type Cause } from "./data";

const stateName = Object.fromEntries(states.map((s) => [s.id, s.name]));
const dotsByState = dots.reduce<Record<string, Dot[]>>((acc, d) => {
  (acc[d.state] ??= []).push(d);
  return acc;
}, {});
const ranked = Object.entries(stats)
  .sort((a, b) => b[1].givenWeek - a[1].givenWeek)
  .map(([id]) => id);

type Filter = Cause | "all";
const filters: Filter[] = ["all", "church", "mission", "orphanage", "school"];
const ago = ["just now", "1 min ago", "3 min ago", "6 min ago"];

/** One state's dots. Memoised so hovering a state repaints only the states that change. */
const StateDots = memo(function StateDots({
  id,
  fill,
  opacity,
}: {
  id: string;
  fill: string;
  opacity: number;
}) {
  return (
    <g
      data-state={id}
      fill={fill}
      opacity={opacity}
      className="transition-[fill,opacity] duration-300"
    >
      {dotsByState[id]?.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={2.6} data-state={id} />
      ))}
    </g>
  );
});

function NigeriaMap({
  filter,
  selected,
  hovered,
  pulse,
  onHover,
  onSelect,
}: {
  filter: Filter;
  selected: string | null;
  hovered: string | null;
  pulse: { id: number; state: string } | null;
  onHover: (s: string | null) => void;
  onSelect: (s: string) => void;
}) {
  const max = useMemo(
    () => Math.max(...Object.values(stats).map((s) => orgCount(s, filter))),
    [filter],
  );
  const stateFrom = (e: React.PointerEvent | React.MouseEvent) => {
    const svg = e.currentTarget as SVGSVGElement;
    const m = svg.getScreenCTM();
    if (!m) return null;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return stateAt(pt.x, pt.y);
  };
  const pulseAt = pulse ? project(states.find((s) => s.id === pulse.state)!.at) : null;

  return (
    <svg
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      role="img"
      aria-label="Map of Nigeria showing where verified organisations are receiving gifts"
      className="h-auto w-full cursor-pointer touch-manipulation select-none"
      onPointerMove={(e) => {
        if (e.pointerType === "mouse") onHover(stateFrom(e));
      }}
      onPointerLeave={() => onHover(null)}
      onClick={(e) => {
        const s = stateFrom(e);
        if (s) onSelect(s);
      }}
    >
      {states.map(({ id }) => {
        const n = orgCount(stats[id], filter);
        const isSel = selected === id;
        const isHov = hovered === id;
        const fill = isSel || isHov ? "#130E30" : n > 0 ? "#FE5102" : "var(--af-line)";
        const opacity = isSel ? 1 : isHov ? 0.75 : n > 0 ? 0.3 + 0.7 * Math.sqrt(n / max) : 1;
        return <StateDots key={id} id={id} fill={fill} opacity={opacity} />;
      })}
      {pulseAt ? (
        <g
          key={pulse!.id}
          transform={`translate(${pulseAt.x} ${pulseAt.y})`}
          className="pointer-events-none"
        >
          <circle r={6} fill="#FE5102" className="map-pulse" />
          <circle r={4} fill="#130E30" />
        </g>
      ) : null}
    </svg>
  );
}

function StatePanel({ id, filter }: { id: string; filter: Filter }) {
  const s = stats[id];
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line-soft bg-paper p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 font-gsf text-[13px] text-muted-ink">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} /> State
          </p>
          <p className="font-display text-[28px] leading-[1.1] text-ink">{stateName[id]}</p>
        </div>
        {s ? (
          <div className="text-right">
            <p className="font-display text-[22px] font-bold leading-none text-ink">
              {formatCompactMoney(s.givenWeek)}
            </p>
            <p className="text-[12px] text-muted-ink">given this week</p>
          </div>
        ) : null}
      </div>

      {s ? (
        <>
          <dl className="grid grid-cols-4 gap-2 border-y border-line-soft py-3 text-center">
            {(Object.keys(causeLabel) as Cause[]).map((c) => (
              <div key={c} className={cn(filter !== "all" && filter !== c && "opacity-40")}>
                <dd className="font-gsf text-lg font-semibold text-heading">{s.orgs[c]}</dd>
                <dt className="text-[11px] text-muted-ink">{causeLabel[c]}</dt>
              </div>
            ))}
          </dl>
          {s.featured ? (
            <Link to={s.featured.to ?? "/discover"} className="group flex gap-3">
              <img
                src={s.featured.photo}
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-[12px] text-muted-ink">
                  <BadgeCheck className="h-3.5 w-3.5 text-[#00B67A]" strokeWidth={1.5} />
                  {s.featured.org} · {s.featured.place}
                </span>
                <span className="block font-gsf text-[14px] leading-[20px] text-heading group-hover:underline">
                  {s.featured.text}
                </span>
              </span>
            </Link>
          ) : (
            <p className="flex items-center gap-2 text-[13px] text-ink-soft">
              <ReceiptText className="h-4 w-4" strokeWidth={1.5} /> {s.receipts} receipts posted
              this month
            </p>
          )}
          <Link
            to="/discover"
            className="press inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink bg-ink px-5 py-2.5 font-gsf text-[15px] font-medium text-ink-contrast hover:opacity-90"
          >
            See causes in {stateName[id]} <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </>
      ) : (
        <p className="text-[14px] leading-[21px] text-ink-soft">
          No verified organisations here yet. If you lead a church or ministry in {stateName[id]},{" "}
          <Link to="/register-org" className="font-medium text-ink underline underline-offset-2">
            register it
          </Link>
          .
        </p>
      )}
    </div>
  );
}

function useFeed(onGift: (state: string) => void) {
  const [head, setHead] = useState(0);
  useEffect(() => {
    if (reducedMotion()) return;
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") setHead((h) => (h + 1) % feed.length);
    }, 2800);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => onGift(feed[head].state), [head, onGift]);
  return head;
}

function LiveFeed({ head }: { head: number }) {
  const items = Array.from(
    { length: 4 },
    (_, k) => feed[(head - k + feed.length * 2) % feed.length],
  );
  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 font-gsf text-[13px] font-semibold text-ink">
        <span className="relative flex h-2 w-2">
          <span className="map-live absolute inset-0 rounded-full bg-[#FE5102]" />
          <span className="relative h-2 w-2 rounded-full bg-[#FE5102]" />
        </span>
        Gifts landing now
      </p>
      <ol className="flex flex-col">
        {items.map((g, k) => (
          <li
            key={`${head}-${k}`}
            className={cn(
              "flex items-center justify-between gap-3 border-t border-line-soft py-2.5 font-gsf text-[14px]",
              k === 0 && "feed-in",
            )}
            style={{ opacity: 1 - k * 0.2 }}
          >
            <span className="min-w-0 truncate text-heading">
              <span className="font-semibold">{formatMoney(g.amount)}</span> to {g.place}
            </span>
            <span className="shrink-0 text-[12px] text-muted-ink">{ago[k]}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The live map block, shared by /map (as the page's h1) and the homepage (as an h2). */
export function OpenGivingSection({
  heading = "h2",
  className,
}: {
  heading?: "h1" | "h2";
  className?: string;
}) {
  const Heading = heading;
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string>("PL");
  const [hovered, setHovered] = useState<string | null>(null);
  const [pulse, setPulse] = useState<{ id: number; state: string } | null>(null);

  const onGift = useMemo(() => {
    let n = 0;
    return (state: string) => setPulse({ id: ++n, state });
  }, []);
  const head = useFeed(onGift);

  return (
    <section
      className={cn(
        "px-6 pb-16 pt-10 sm:px-10 md:pb-24 md:pt-14 lg:px-[clamp(40px,6vw,120px)]",
        className,
      )}
    >
      <div className="mx-auto grid w-full max-w-[1440px] gap-10 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-14">
        <div className="flex flex-col gap-7 lg:pt-6">
          <div className="flex flex-col gap-4">
            <p className="font-gsf text-sm font-semibold uppercase tracking-[0.1em] text-ink-soft">
              Open giving
            </p>
            <Heading className="font-display text-[clamp(38px,4.2vw,68px)] leading-[1.02] tracking-[-0.03em] text-ink">
              Watch giving land across Nigeria.
            </Heading>
            <p className="text-lg leading-[1.55] tracking-[-0.02em] text-ink-soft">
              Every gift goes to a verified organisation and comes back with a receipt. This is what
              that looked like this week.
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-4 border-y border-line py-5">
            {[
              { v: formatCompactMoney(totals.givenWeek), l: "given this week" },
              { v: `${totals.orgs}`, l: "verified organisations" },
              { v: `${totals.receipts}`, l: "receipts posted" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col gap-1">
                <dd className="font-display text-[clamp(20px,1.75vw,28px)] font-bold leading-none text-ink">
                  <CountUp value={s.v} />
                </dd>
                <dt className="text-[13px] leading-[17px] text-muted-ink">{s.l}</dt>
              </div>
            ))}
          </dl>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">Your state</span>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full rounded-lg border border-line-input bg-paper px-3.5 py-3 text-[15px] text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
            >
              {[...states]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </label>

          <div className="hidden lg:block">
            <StatePanel id={selected} filter={filter} />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="-mx-6 flex gap-2 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  filter === f
                    ? "border-ink bg-ink text-ink-contrast"
                    : "border-line bg-paper text-ink-soft hover:border-ink hover:text-ink",
                )}
              >
                {f === "all" ? "All causes" : causeLabel[f]}
              </button>
            ))}
          </div>

          <div className="relative rounded-3xl bg-panel p-4 sm:p-8">
            <NigeriaMap
              filter={filter}
              selected={selected}
              hovered={hovered}
              pulse={pulse}
              onHover={setHovered}
              onSelect={setSelected}
            />
            {hovered && hovered !== selected ? (
              <p className="pointer-events-none absolute left-6 top-6 rounded-full bg-ink px-3 py-1 text-[13px] font-medium text-ink-contrast">
                {stateName[hovered]} · {orgCount(stats[hovered], filter)}{" "}
                {filter === "all" ? "organisations" : causeLabel[filter].toLowerCase()}
              </p>
            ) : null}
          </div>

          <div className="lg:hidden">
            <StatePanel id={selected} filter={filter} />
          </div>

          <div className="lg:hidden">
            <p className="pb-3 text-[13px] font-semibold text-ink">Most given this week</p>
            <div className="-mx-6 flex snap-x gap-3 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {ranked.slice(0, 10).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelected(id)}
                  className={cn(
                    "flex w-[150px] shrink-0 snap-start flex-col gap-1 rounded-xl border p-3 text-left transition-colors",
                    selected === id ? "border-ink bg-panel" : "border-line-soft bg-paper",
                  )}
                >
                  <span className="text-[14px] font-semibold text-heading">{stateName[id]}</span>
                  <span className="text-[12px] text-muted-ink">
                    {formatCompactMoney(stats[id].givenWeek)} · {orgCount(stats[id], "all")} orgs
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:max-w-[560px]">
            <LiveFeed head={head} />
          </div>

          <p className="text-[12px] text-subtle">
            Prototype: figures are sample data. Gifts are shown without names or exact locations.
          </p>
        </div>
      </div>
    </section>
  );
}

export function OpenGiving() {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div className="min-h-screen overflow-x-clip bg-paper font-gsf text-heading">
      <SiteNav />
      <main>
        <OpenGivingSection heading="h1" />

        <HowItWorks />

        <section className="bg-panel px-6 py-20 sm:px-10 md:py-28 lg:px-[clamp(40px,6vw,120px)]">
          <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-10">
            <Reveal className="flex max-w-[720px] flex-col gap-4">
              <h2 className="font-display text-[clamp(30px,3vw,52px)] leading-[1.08] tracking-[-0.03em] text-ink">
                From budget to receipt, in the open.
              </h2>
              <p className="text-lg leading-[1.55] text-ink-soft">
                Every campaign shows what it needs, what has come in, and what each naira was spent
                on. Hover a budget line to find its receipt.
              </p>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {campaignLayers(hover, setHover).map((l) => (
                <div key={l.id} className="h-[200px]">
                  {l.node}
                </div>
              ))}
            </div>
          </div>
        </section>

        <Cta />
      </main>
      <Footer />
    </div>
  );
}
