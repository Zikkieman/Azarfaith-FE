import { memo, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, ChevronDown } from "lucide-react";
import { SiteNav } from "@/components/landing/SiteNav";
import { Footer } from "@/components/landing/Footer";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Cta } from "@/components/landing/Cta";
import { CountUp, Reveal } from "@/components/motion/Reveal";
import { useCampaignLayers } from "@/components/story/layers";
import { formatCompactMoney, formatMoney, type Campaign, type Org, type OrgCategory } from "@/lib/domain";
import { reducedMotion } from "@/lib/motion";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { VIEW, dots, project, stateAt, states, type Dot } from "./nigeria";

const stateName = Object.fromEntries(states.map((s) => [s.id, s.name]));
const dotsByState = dots.reduce<Record<string, Dot[]>>((acc, d) => {
  (acc[d.state] ??= []).push(d);
  return acc;
}, {});

type Cause = "church" | "mission" | "orphanage" | "school" | "other";
type FeaturedCause = { org: string; place: string; text: string; photo: string; to: string };
type StateStats = {
  orgs: Record<Cause, number>;
  raised: number;
  featured?: FeaturedCause;
};
type LiveFeedItem = { state: string; amount: number; title: string };

const emptyOrgs = (): Record<Cause, number> => ({
  church: 0,
  mission: 0,
  orphanage: 0,
  school: 0,
  other: 0,
});

const mapCause = (category: OrgCategory): Cause =>
  category === "church" || category === "mission" || category === "orphanage" || category === "school"
    ? category
    : "other";

function stateIdForLocation(location: string) {
  const value = location.toLocaleLowerCase();
  if (value.includes("abuja") || value.includes("fct") || value.includes("federal capital territory")) {
    return "FC";
  }
  return states.find((state) => value.includes(state.name.toLocaleLowerCase()))?.id;
}

function getLiveMapData(orgs: Org[], campaigns: Campaign[]) {
  const verifiedOrgs = orgs.filter((org) => org.verificationStatus === "verified");
  const orgById = new Map(verifiedOrgs.map((org) => [org.id, org]));
  const stats: Record<string, StateStats> = {};

  for (const org of verifiedOrgs) {
    const stateId = stateIdForLocation(org.location);
    if (!stateId) continue;
    const entry = (stats[stateId] ??= { orgs: emptyOrgs(), raised: 0 });
    entry.orgs[mapCause(org.category)] += 1;
    if (!entry.featured && org.photos[0]) {
      entry.featured = {
        org: org.name,
        place: org.location,
        text: org.tagline || "View this verified organization.",
        photo: org.photos[0],
        to: `/org/${org.id}`,
      };
    }
  }

  for (const campaign of campaigns.filter((item) => item.verificationStatus === "verified")) {
    const parentOrg = campaign.orgId ? orgById.get(campaign.orgId) : undefined;
    const stateId = stateIdForLocation(campaign.location || parentOrg?.location || "");
    if (!stateId) continue;
    const entry = (stats[stateId] ??= { orgs: emptyOrgs(), raised: 0 });
    entry.raised += campaign.raised;
    if (campaign.cover && (!entry.featured || entry.featured.to.startsWith("/org/"))) {
      entry.featured = {
        org: parentOrg?.name ?? campaign.raiser.name,
        place: campaign.location || parentOrg?.location || stateName[stateId],
        text: campaign.title,
        photo: campaign.cover,
        to: `/campaign/${campaign.id}`,
      };
    }
  }

  const feed = Object.entries(stats)
    .filter(([, value]) => value.raised > 0 && value.featured)
    .sort(([, a], [, b]) => b.raised - a.raised)
    .map(([state, value]) => ({ state, amount: value.raised, title: value.featured!.text }));
  const totals = {
    raised: Object.values(stats).reduce((sum, state) => sum + state.raised, 0),
    orgs: verifiedOrgs.length,
    campaigns: campaigns.filter((item) => item.verificationStatus === "verified").length,
  };

  return { stats, feed, totals };
}

const orgCount = (state: StateStats | undefined) =>
  state ? Object.values(state.orgs).reduce((sum, count) => sum + count, 0) : 0;

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
  stats,
  selected,
  hovered,
  pulse,
  onHover,
  onSelect,
}: {
  stats: Record<string, StateStats>;
  selected: string | null;
  hovered: string | null;
  pulse: { id: number; state: string } | null;
  onHover: (s: string | null) => void;
  onSelect: (s: string) => void;
}) {
  const max = useMemo(
    () => Math.max(1, ...Object.values(stats).map(orgCount)),
    [stats],
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
      aria-label="Map of Nigeria showing where verified organizations are receiving gifts"
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
        const n = orgCount(stats[id]);
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
function StatePanel({ id, stats }: { id: string; stats: Record<string, StateStats> }) {
  const s = stats[id];
  if (!s) {
    return (
      <p className="text-[15px] leading-[23px] text-ink-soft">
        No verified organizations in {stateName[id]} yet. If you lead a church or ministry here,{" "}
        <Link to="/signup" search={{}} className="font-semibold text-ink underline underline-offset-2">
          register it
        </Link>
        .
      </p>
    );
  }
  return (
    <div key={id} className="state-in flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <p className="font-display text-[clamp(48px,4.6vw,76px)] leading-[0.95] tracking-[-0.04em] text-ink">
          {formatCompactMoney(s.raised)}
        </p>
        <p className="text-[15px] leading-[23px] text-ink-soft">
          raised across {orgCount(s)} verified organizations
        </p>
      </div>
      {s.featured ? (
        <Link to={s.featured.to} className="group flex flex-col gap-3">
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

function useFeed(feed: LiveFeedItem[], onGift: (state: string) => void) {
  const [head, setHead] = useState(0);
  useEffect(() => {
    if (reducedMotion() || feed.length < 2) return;
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") setHead((h) => (h + 1) % feed.length);
    }, 2800);
    return () => window.clearInterval(t);
  }, [feed.length]);
  useEffect(() => {
    if (feed[head]) onGift(feed[head].state);
  }, [feed, head, onGift]);
  return head;
}

/** The newest gift, swapping in as the next one lands. */
function LiveTicker({ feed, head }: { feed: LiveFeedItem[]; head: number }) {
  const g = feed[head];
  if (!g) {
    return <p className="font-gsf text-[14px] text-muted-ink">Published campaigns will appear here as giving begins.</p>;
  }
  return (
    <p className="flex items-center gap-2.5 font-gsf text-[14px]">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="map-live absolute inset-0 rounded-full bg-[#FE5102]" />
        <span className="relative h-2 w-2 rounded-full bg-[#FE5102]" />
      </span>
      <span key={head} className="feed-in min-w-0 flex-1 truncate text-heading">
        <span className="font-semibold">{formatMoney(g.amount)}</span> raised for {g.title}
      </span>
      <span className="shrink-0 text-[12px] text-muted-ink">just now</span>
    </p>
  );
}

/** Scroll distance (svh) each toured state holds the stage for on desktop. */
const STEP_SVH = 22;
const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;

/**
 * The live map block, shared by /map (as the page's h1) and the homepage (as an h2).
 * Desktop: the stage pins and scrolling steps through TOUR in place. Phones: the map sticks to
 * the top while one story per toured state scrolls up beneath it.
 */
export function OpenGivingSection({
  heading = "h2",
  className,
}: {
  heading?: "h1" | "h2";
  className?: string;
}) {
  const Heading = heading;
  const orgs = useApp((state) => state.orgs);
  const campaigns = useApp((state) => state.campaigns);
  const { stats, feed, totals } = useMemo(() => getLiveMapData(orgs, campaigns), [campaigns, orgs]);
  const tour = useMemo(() => {
    const populated = Object.keys(stats).sort((a, b) => orgCount(stats[b]) - orgCount(stats[a]));
    return populated.slice(0, 3).length ? populated.slice(0, 3) : ["FC", "LA", "PL"];
  }, [stats]);
  const [selected, setSelected] = useState<string>("FC");
  const [hovered, setHovered] = useState<string | null>(null);
  const [pulse, setPulse] = useState<{ id: number; state: string } | null>(null);
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  const pinRef = useRef<HTMLDivElement>(null);
  const storyRefs = useRef<(HTMLDivElement | null)[]>([]);

  const onGift = useMemo(() => {
    let n = 0;
    return (state: string) => setPulse({ id: ++n, state });
  }, []);
  const head = useFeed(feed, onGift);

  useEffect(() => {
    if (!tour.includes(selected)) setSelected(tour[0]);
  }, [selected, tour]);

  const { scrollYProgress } = useScroll({ target: pinRef, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!isDesktop()) return;
    const i = Math.min(tour.length - 1, Math.max(0, Math.floor(v * tour.length)));
    if (i === stepRef.current) return;
    stepRef.current = i;
    setStep(i);
    setSelected(tour[i]);
  });

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        if (isDesktop()) return;
        for (const e of entries) {
          if (e.isIntersecting) setSelected((e.target as HTMLElement).dataset.state ?? tour[0]);
        }
      },
      { rootMargin: "-62% 0px -36% 0px" },
    );
    storyRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [tour]);

  const jump = (i: number) => {
    const el = pinRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: top + (range * (i + 0.5)) / tour.length,
      behavior: reducedMotion() ? "auto" : "smooth",
    });
  };

  return (
    <section
      className={cn(
        "px-6 pb-16 pt-10 sm:px-10 md:pb-24 md:pt-14 lg:px-[clamp(40px,6vw,120px)] lg:pb-10",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 lg:gap-6">
        <div className="mx-auto flex max-w-[760px] flex-col items-center gap-4 text-center">
          <p className="font-gsf text-sm font-semibold uppercase tracking-[0.1em] text-ink-soft">
            Open giving
          </p>
          <Heading className="text-balance font-display text-[clamp(38px,4.2vw,68px)] leading-[1.02] tracking-[-0.03em] text-ink">
            Watch giving land across Nigeria.
          </Heading>
          <p className="max-w-[620px] text-pretty text-lg leading-[1.6] tracking-[-0.02em] text-ink-soft">
            <strong className="font-semibold text-ink">
              <CountUp value={formatCompactMoney(totals.raised)} />
            </strong>{" "}
            raised across{" "}
            <strong className="font-semibold text-ink">
              <CountUp value={`${totals.orgs}`} />
            </strong>{" "}
            verified organizations and{" "}
            <strong className="font-semibold text-ink">
              <CountUp value={`${totals.campaigns}`} />
            </strong>{" "}
            published campaigns. Every gift comes back with proof.
          </p>
        </div>

        <div
          ref={pinRef}
          style={{ "--tour": `${tour.length * STEP_SVH}svh` } as CSSProperties}
          className="lg:h-[calc(100svh+var(--tour))]"
        >
          <div className="flex flex-col gap-6 lg:sticky lg:top-0 lg:h-svh lg:justify-center lg:py-6">
            <div className="grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-x-14">
              <div className="sticky top-0 z-10 -mx-6 bg-paper px-6 py-3 sm:-mx-10 sm:px-10 lg:static lg:col-start-2 lg:row-start-1 lg:m-0 lg:w-full lg:max-w-[calc((100svh-210px)*1.232+64px)] lg:justify-self-center lg:bg-transparent lg:p-0">
                <div className="relative rounded-3xl bg-panel p-4 sm:p-8">
                  <NigeriaMap
                    stats={stats}
                    selected={selected}
                    hovered={hovered}
                    pulse={pulse}
                    onHover={setHovered}
                    onSelect={setSelected}
                  />
                  {hovered && hovered !== selected ? (
                    <p className="pointer-events-none absolute left-6 top-6 rounded-full bg-ink px-3 py-1 text-[13px] font-medium text-ink-contrast">
                      {stateName[hovered]} · {orgCount(stats[hovered])} organizations
                    </p>
                  ) : null}
                  <div className="mt-3 border-t border-line-soft pt-3 sm:mt-5 sm:pt-4">
                    <LiveTicker feed={feed} head={head} />
                  </div>
                </div>
              </div>

              <div className="hidden min-w-0 flex-col gap-8 lg:col-start-1 lg:row-start-1 lg:flex lg:self-center">
                <div className="-my-2 flex gap-1.5">
                  {tour.map((id, i) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => jump(i)}
                      aria-label={`Show ${stateName[id]}`}
                      aria-current={step === i ? "step" : undefined}
                      className="group py-2"
                    >
                      <span
                        className={cn(
                          "block h-[3px] w-10 rounded-full transition-colors duration-300",
                          i <= step ? "bg-[#FE5102]" : "bg-line group-hover:bg-line-strong",
                        )}
                      />
                    </button>
                  ))}
                </div>
                <StatePicker selected={selected} onChange={setSelected} />
                <StatePanel id={selected} stats={stats} />
              </div>

              <div className="flex flex-col lg:hidden">
                {tour.map((id, i) => (
                  <div
                    key={id}
                    ref={(el) => {
                      storyRefs.current[i] = el;
                    }}
                    data-state={id}
                    className="flex flex-col gap-5 border-t border-line py-7 first:border-t-0 first:pt-5"
                  >
                    <p className="font-display text-[clamp(24px,2vw,32px)] font-medium leading-[1.2] tracking-[-0.03em] text-ink">
                      What&rsquo;s happening in{" "}
                      <span className="text-[#FE5102]">{stateName[id]}</span>
                    </p>
                    <StatePanel id={id} stats={stats} />
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-[12px] text-subtle">
              Figures reflect published campaigns and verified organizations. Donor identities are never shown.
            </p>
          </div>
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
              {useCampaignLayers(hover, setHover).map((l) => (
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
