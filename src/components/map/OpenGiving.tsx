import { memo, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, ChevronDown } from "lucide-react";
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
import { feed, orgCount, stats, totals, type Cause } from "./data";

const stateName = Object.fromEntries(states.map((s) => [s.id, s.name]));
const dotsByState = dots.reduce<Record<string, Dot[]>>((acc, d) => {
  (acc[d.state] ??= []).push(d);
  return acc;
}, {});

type Filter = Cause | "all";

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

/** "What's happening in [Plateau ▾]": a native select dressed as the state name. */
function StatePicker({ selected, onChange }: { selected: string; onChange: (id: string) => void }) {
  return (
    <label className="flex flex-wrap items-baseline gap-x-2 font-display text-[clamp(24px,2vw,32px)] font-medium leading-[1.2] tracking-[-0.03em] text-ink">
      <span>What&rsquo;s happening in</span>
      <span className="relative inline-flex items-baseline gap-1 text-[#FE5102]">
        <span className="underline decoration-2 underline-offset-[6px]">{stateName[selected]}</span>
        <ChevronDown className="h-5 w-5 translate-y-0.5" strokeWidth={2.25} />
        <select
          aria-label="Choose a state"
          value={selected}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {[...states]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
        </select>
      </span>
    </label>
  );
}

/** One state's week in three beats: how much, the latest proof, and where to go next. */
function StatePanel({ id }: { id: string }) {
  const s = stats[id];
  if (!s) {
    return (
      <p className="text-[15px] leading-[23px] text-ink-soft">
        No verified organisations in {stateName[id]} yet. If you lead a church or ministry here,{" "}
        <Link to="/signup" className="font-semibold text-ink underline underline-offset-2">
          register it
        </Link>
        .
      </p>
    );
  }
  return (
    <div key={id} className="feed-in flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <p className="font-display text-[clamp(48px,4.6vw,76px)] leading-[0.95] tracking-[-0.04em] text-ink">
          {formatCompactMoney(s.givenWeek)}
        </p>
        <p className="text-[15px] leading-[23px] text-ink-soft">
          given this week to {orgCount(s, "all")} verified organisations
        </p>
      </div>
      {s.featured ? (
        <Link to={s.featured.to ?? "/discover"} className="group flex flex-col gap-3">
          <span className="block aspect-[16/10] overflow-hidden rounded-2xl bg-[#F1EFEA]">
            <img
              src={s.featured.photo}
              alt=""
              loading="lazy"
              className="halftone h-full w-full object-cover group-hover:scale-[1.03]"
            />
          </span>
          <span className="flex items-center gap-1.5 pt-1 text-[13px] text-muted-ink">
            <BadgeCheck className="h-4 w-4 shrink-0 text-[#00B67A]" strokeWidth={2} />
            <span className="truncate">
              {s.featured.org}, {s.featured.place}
            </span>
          </span>
          <span className="text-balance font-display text-[clamp(20px,1.5vw,24px)] leading-[1.25] tracking-[-0.02em] text-heading decoration-1 underline-offset-4 group-hover:underline">
            {s.featured.text}
          </span>
        </Link>
      ) : null}
      <Link
        to="/discover"
        className="group inline-flex items-center gap-1.5 self-start text-[15px] font-semibold text-ink"
      >
        See causes in {stateName[id]}
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
          strokeWidth={2}
        />
      </Link>
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

/** The newest gift, swapping in as the next one lands. */
function LiveTicker({ head }: { head: number }) {
  const g = feed[head];
  return (
    <p className="flex items-center gap-2.5 font-gsf text-[14px]">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="map-live absolute inset-0 rounded-full bg-[#FE5102]" />
        <span className="relative h-2 w-2 rounded-full bg-[#FE5102]" />
      </span>
      <span key={head} className="feed-in min-w-0 flex-1 truncate text-heading">
        <span className="font-semibold">{formatMoney(g.amount)}</span> to {g.place}
      </span>
      <span className="shrink-0 text-[12px] text-muted-ink">just now</span>
    </p>
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
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-12 lg:gap-16">
        <div className="mx-auto flex max-w-[760px] flex-col items-center gap-4 text-center">
          <p className="font-gsf text-sm font-semibold uppercase tracking-[0.1em] text-ink-soft">
            Open giving
          </p>
          <Heading className="text-balance font-display text-[clamp(38px,4.2vw,68px)] leading-[1.02] tracking-[-0.03em] text-ink">
            Watch giving land across Nigeria.
          </Heading>
          <p className="max-w-[620px] text-pretty text-lg leading-[1.6] tracking-[-0.02em] text-ink-soft">
            <strong className="font-semibold text-ink">
              <CountUp value={formatCompactMoney(totals.givenWeek)} />
            </strong>{" "}
            given this week to{" "}
            <strong className="font-semibold text-ink">
              <CountUp value={`${totals.orgs}`} />
            </strong>{" "}
            verified organisations, with{" "}
            <strong className="font-semibold text-ink">
              <CountUp value={`${totals.receipts}`} />
            </strong>{" "}
            receipts posted. Every gift comes back with proof.
          </p>
        </div>

        {/* Phones: the map, then the state story. Desktop: the state story beside the map. */}
        <div className="grid gap-y-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-x-14">
          <div className="relative min-w-0 self-start rounded-3xl bg-panel p-4 sm:p-8 lg:col-start-2 lg:row-start-1">
            <NigeriaMap
              filter="all"
              selected={selected}
              hovered={hovered}
              pulse={pulse}
              onHover={setHovered}
              onSelect={setSelected}
            />
            {hovered && hovered !== selected ? (
              <p className="pointer-events-none absolute left-6 top-6 rounded-full bg-ink px-3 py-1 text-[13px] font-medium text-ink-contrast">
                {stateName[hovered]} · {orgCount(stats[hovered], "all")} organisations
              </p>
            ) : null}
            <div className="mt-3 border-t border-line-soft pt-3 sm:mt-5 sm:pt-4">
              <LiveTicker head={head} />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-5 pt-6 lg:col-start-1 lg:row-start-1 lg:gap-8 lg:self-center lg:pt-0">
            <StatePicker selected={selected} onChange={setSelected} />
            <StatePanel id={selected} />
          </div>
        </div>

        <p className="-mt-6 text-center text-[12px] text-subtle lg:-mt-10">
          Prototype: figures are sample data. Gifts are shown without names or exact locations.
        </p>
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
