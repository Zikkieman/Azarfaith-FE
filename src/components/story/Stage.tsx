import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  easeInOut,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import logoMark from "@/assets/signup/logo-mark.svg";
import { cn } from "@/lib/utils";
import { appeals, causes, checks, type Priority } from "./data";
import {
  AppealCard,
  CauseCard,
  CheckNode,
  GiverChip,
  OrgCard,
  PipelineStage,
  UpdateCard,
} from "./pieces";
import { campaignLayers } from "./layers";

/* ─── Timeline ────────────────────────────────────────────────────────────
   One scroll progress value p ∈ [0, 1] drives every element on the stage.
   hero .00–.09 · old way .09–.28 · verified .28–.43 · causes .43–.58
   campaign .58–.72 · gift .72–.86 · thank-you .86–1                       */
const EASE = { ease: easeInOut };

type Vp = { w: number; h: number; mobile: boolean };
type Pt = { x: number; y: number };

function useViewport(): Vp {
  const [vp, setVp] = useState<Vp>({ w: 1440, h: 900, mobile: false });
  useEffect(() => {
    const on = () =>
      setVp({ w: window.innerWidth, h: window.innerHeight, mobile: window.innerWidth < 768 });
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return vp;
}

/** Deterministic pseudo-random so the "chaos" is identical on every render. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ─── Geometry for each scene, in px from the stage's top-left ─────────── */
function useLayout(vp: Vp) {
  return useMemo(() => {
    const { w, h, mobile } = vp;
    const n = mobile ? 10 : 18;
    const card = mobile ? { w: 158, h: 58 } : { w: 224, h: 66 };
    const cx = w / 2;
    const mark: Pt = { x: cx, y: h * (mobile ? 0.3 : 0.32) };
    const collapse: Pt = { x: cx, y: h * 0.52 };

    // Scene 1: jittered grid around a clear centre where the headline sits.
    const rand = rng(7);
    const cols = mobile ? 3 : 6;
    const rows = mobile ? 6 : 4;
    const top = 90;
    const cellW = w / cols;
    const cellH = (h - top - 20) / rows;
    const cells: Pt[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const p = { x: (c + 0.5) * cellW, y: top + (r + 0.5) * cellH };
        const dx = (p.x - cx) / (w * (mobile ? 0.5 : 0.34));
        const dy = (p.y - h * 0.5) / (h * (mobile ? 0.12 : 0.2));
        if (dx * dx + dy * dy > 1) cells.push(p);
      }
    cells.sort(() => rand() - 0.5);
    const chaos = Array.from({ length: n }, (_, i) => {
      const c = cells[i % cells.length];
      return {
        x: c.x + (rand() - 0.5) * cellW * 0.35,
        y: c.y + (rand() - 0.5) * cellH * 0.35,
        r: (rand() - 0.5) * 18,
      };
    });
    const chaos2 = chaos.map((p) => ({
      x: cx + (p.x - cx) * 1.16 + (rand() - 0.5) * 40,
      y: h * 0.5 + (p.y - h * 0.5) * 1.12 + (rand() - 0.5) * 30,
      r: p.r * 1.8,
    }));

    // Scene 2: six checks around the organization.
    const org: Pt = { x: cx, y: h * (mobile ? 0.4 : 0.6) };
    const ring: Pt[] = checks.map((_, i) => {
      if (mobile) return { x: cx + (i % 2 ? 84 : -84), y: h * 0.55 + Math.floor(i / 2) * 64 };
      const a = -Math.PI / 2 + (i / checks.length) * Math.PI * 2;
      return {
        x: cx + Math.cos(a) * Math.min(w * 0.3, 400),
        y: org.y + Math.sin(a) * Math.min(h * 0.26, 220),
      };
    });

    // Scene 3: causes orbit the giver, then sort by relevance.
    const giver: Pt = { x: cx, y: h * (mobile ? 0.4 : 0.6) };
    const ell = (rx: number, ry: number, i: number) => {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2 + 0.17;
      return { x: cx + Math.cos(a) * rx, y: giver.y + Math.sin(a) * ry };
    };
    const strongIdx = Array.from({ length: n }, (_, i) => i).filter((i) => causes[i].strong);
    const orbitMid: Pt[] = [];
    const orbitSorted: Pt[] = [];
    for (let i = 0; i < n; i++) {
      if (mobile) {
        orbitMid.push({ x: cx + (i % 2 ? 84 : -84), y: h * 0.64 + Math.floor(i / 2) * 62 });
        const k = strongIdx.indexOf(i);
        orbitSorted.push(
          k >= 0
            ? { x: cx, y: h * 0.62 + k * 64 }
            : { x: cx + (i % 2 ? 1 : -1) * w * 0.56, y: h * 0.64 + Math.floor(i / 2) * 62 },
        );
      } else {
        // Alternate cards sit on an inner ring so neighbours never overlap.
        const k = i % 2 ? 0.74 : 1;
        orbitMid.push(ell(Math.min(w * 0.38, 540) * k, h * 0.29 * k, i));
        orbitSorted.push(
          causes[i].strong
            ? ell(Math.min(w * 0.25, 360), h * 0.19, i)
            : ell(Math.min(w * 0.47, 680), h * 0.37, i),
        );
      }
    }

    // Scene 4: six layers, stacked then fanned into a grid (phones: one column of four).
    const stackAt: Pt = { x: cx, y: h * 0.6 };
    let layerBox: { w: number; h: number }[];
    let grid: Pt[];
    let layerHidden: boolean[];
    if (mobile) {
      const lw = w - 48;
      const heights = [118, 158, 98, 0, 0, 86]; // need, budget, raised, (receipts), (updates), gap
      layerHidden = heights.map((v) => v === 0);
      layerBox = heights.map((v) => ({ w: lw, h: v || 100 }));
      let y = h * 0.27;
      grid = heights.map((v) => {
        if (!v) return stackAt;
        const pt = { x: cx, y: y + v / 2 };
        y += v + 10;
        return pt;
      });
    } else {
      const lw = Math.min(260, (w - 160) / 3);
      const lh = 186;
      const gap = 20;
      const gy0 = h * 0.62 - (2 * lh + gap) / 2;
      const gx0 = cx - (3 * lw + 2 * gap) / 2;
      layerHidden = Array(6).fill(false);
      layerBox = Array(6).fill({ w: lw, h: lh });
      grid = Array.from({ length: 6 }, (_, i) => ({
        x: gx0 + (i % 3) * (lw + gap) + lw / 2,
        y: gy0 + Math.floor(i / 3) * (lh + gap) + lh / 2,
      }));
    }

    // Scene 5: the gift's path through five stages.
    const sw = mobile ? w - 88 : Math.min(210, (w - 200) / 5);
    const stages: Pt[] = Array.from({ length: 5 }, (_, i) =>
      mobile
        ? { x: cx + 18, y: h * 0.33 + i * 84 }
        : { x: cx - 2 * (sw + 18) + i * (sw + 18), y: h * 0.56 },
    );

    return {
      n,
      card,
      cx,
      mark,
      collapse,
      chaos,
      chaos2,
      org,
      ring,
      giver,
      orbitMid,
      orbitSorted,
      strongIdx,
      layerBox,
      layerHidden,
      mobile,
      grid,
      stackAt,
      stage: { w: sw },
      stages,
    };
  }, [vp]);
}

type Layout = ReturnType<typeof useLayout>;

/* ─── Small helpers ──────────────────────────────────────────────────── */

/** Fades a block in and out over [a, b] of the timeline. */
function useWindow(p: MotionValue<number>, a: number, b: number, edge = 0.02) {
  const opacity = useTransform(p, [a, a + edge, b - edge, b], [0, 1, 1, 0]);
  const y = useTransform(p, [a, a + edge, b - edge, b], [24, 0, 0, -24], EASE);
  const filter = useTransform(
    p,
    [a, a + edge, b - edge, b],
    ["blur(8px)", "blur(0px)", "blur(0px)", "blur(8px)"],
  );
  const pointerEvents = useTransform(p, (v) => (v > a + edge && v < b - edge ? "auto" : "none"));
  return { opacity, y, filter, pointerEvents };
}

function Headline({
  p,
  range,
  children,
  sub,
  at = "top",
}: {
  p: MotionValue<number>;
  range: [number, number];
  children: ReactNode;
  sub?: ReactNode;
  at?: "top" | "center";
}) {
  const { opacity, y, filter } = useWindow(p, range[0], range[1]);
  return (
    <motion.div
      style={{ opacity, y, filter }}
      className={cn(
        "pointer-events-none absolute inset-x-0 z-30 mx-auto flex max-w-[1100px] flex-col items-center gap-3 px-6 text-center",
        at === "top" ? "top-[max(84px,10vh)]" : "top-1/2 -translate-y-1/2",
      )}
    >
      <h2 className="font-display text-[clamp(34px,5.6vw,92px)] leading-[1.02] tracking-[-0.03em] text-ink">
        {children}
      </h2>
      {sub ? (
        <p className="max-w-[560px] font-gsf text-[clamp(15px,1.2vw,18px)] leading-[1.5] text-ink-soft max-md:hidden">
          {sub}
        </p>
      ) : null}
    </motion.div>
  );
}

/* ─── The continuous system: one token, three identities ───────────────── */
function Token({
  i,
  p,
  L,
  checksDone,
  hovered,
}: {
  i: number;
  p: MotionValue<number>;
  L: Layout;
  checksDone: number;
  hovered: Priority | null;
}) {
  const node = i < checks.length;
  const strong = !!causes[i].strong;
  const lead = i === L.strongIdx[0];
  const appear = 0.095 + (i / L.n) * 0.09;
  const T = [0, 0.075, appear, 0.215, 0.255, 0.285, 0.3, 0.4, 0.44, 0.47, 0.53, 0.575, 0.6, 1];
  const half = (q: Pt) => ({ x: q.x - L.card.w / 2, y: q.y - L.card.h / 2 });
  const pts: Pt[] = [
    L.mark,
    L.mark,
    L.chaos[i],
    L.chaos2[i],
    L.collapse,
    L.collapse,
    node ? L.ring[i] : L.collapse,
    node ? L.ring[i] : L.collapse,
    L.orbitMid[i],
    L.orbitMid[i],
    L.orbitSorted[i],
    L.stackAt,
    L.stackAt,
    L.stackAt,
  ].map(half);

  const x = useTransform(
    p,
    T,
    pts.map((q) => q.x),
    EASE,
  );
  const y = useTransform(
    p,
    T,
    pts.map((q) => q.y),
    EASE,
  );
  const scale = useTransform(
    p,
    T,
    [
      0.2,
      0.2,
      1,
      1,
      0.15,
      0.1,
      node ? 1 : 0.1,
      node ? 1 : 0.1,
      0.95,
      0.95,
      strong ? 1.06 : 0.8,
      lead ? 1.3 : 0.3,
      0.3,
      0.3,
    ],
    EASE,
  );
  const opacity = useTransform(p, T, [
    0,
    0,
    1,
    1,
    1,
    0,
    node ? 1 : 0,
    node ? 1 : 0,
    1,
    1,
    strong ? 1 : 0.2,
    0,
    0,
    0,
  ]);
  const c1 = L.chaos[i].r;
  const rotate = useTransform(p, T, [0, 0, c1, c1 * 1.8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], EASE);
  const appealO = useTransform(p, [0, 0.265, 0.285, 1], [1, 1, 0, 0]);
  const nodeO = useTransform(p, [0, 0.285, 0.3, 0.4, 0.43, 1], [0, 0, 1, 1, 0, 0]);
  const causeO = useTransform(p, [0, 0.43, 0.45, 1], [0, 0, 1, 1]);
  const pointerEvents = useTransform(p, (v) => (v > 0.45 && v < 0.555 ? "auto" : "none"));
  const zIndex = useTransform(p, (v) => (v > 0.45 && v < 0.6 && strong ? 12 : 10));

  const a = appeals[i];
  const c = causes[i];
  return (
    <motion.div
      style={{
        x,
        y,
        scale,
        opacity,
        rotate,
        pointerEvents,
        zIndex,
        width: L.card.w,
        height: L.card.h,
      }}
      className="absolute left-0 top-0 will-change-transform"
    >
      <motion.div style={{ opacity: appealO }} className="absolute inset-0">
        <AppealCard source={a.source} text={a.text} urgent={a.urgent} />
      </motion.div>
      {node ? (
        <motion.div style={{ opacity: nodeO }} className="absolute inset-0 py-2.5">
          <CheckNode label={checks[i]} done={checksDone > i} />
        </motion.div>
      ) : null}
      <motion.div style={{ opacity: causeO }} className="absolute inset-0">
        <CauseCard
          name={c.name}
          place={c.place}
          detail={c.detail}
          highlighted={!!hovered && c.tags.includes(hovered)}
        />
      </motion.div>
    </motion.div>
  );
}

/* ─── Scene pieces with their own windows ─────────────────────────────── */

function CheckLines({ p, L }: { p: MotionValue<number>; L: Layout }) {
  const opacity = useTransform(p, [0.285, 0.3, 0.4, 0.43], [0, 1, 1, 0]);
  const draw = useTransform(p, [0.3, 0.345], [0, 1], EASE);
  if (L.mobile) return null;
  return (
    <motion.svg
      style={{ opacity }}
      className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
    >
      {L.ring.map((q, i) => (
        <motion.line
          key={i}
          x1={L.org.x}
          y1={L.org.y}
          x2={q.x}
          y2={q.y}
          stroke="var(--af-line)"
          strokeWidth={1.5}
          style={{ pathLength: draw }}
        />
      ))}
    </motion.svg>
  );
}

function Placed({
  p,
  at,
  range,
  children,
  z = 20,
  from = 0.92,
}: {
  p: MotionValue<number>;
  at: Pt;
  range: [number, number];
  children: ReactNode;
  z?: number;
  from?: number;
}) {
  const [a, b] = range;
  const opacity = useTransform(p, [a, a + 0.015, b - 0.015, b], [0, 1, 1, 0]);
  const scale = useTransform(p, [a, a + 0.025, b - 0.015, b], [from, 1, 1, from], EASE);
  const pointerEvents = useTransform(p, (v) => (v > a + 0.015 && v < b - 0.015 ? "auto" : "none"));
  return (
    <motion.div
      style={{ left: at.x, top: at.y, opacity, scale, pointerEvents, zIndex: z }}
      className="absolute -translate-x-1/2 -translate-y-1/2"
    >
      {children}
    </motion.div>
  );
}

function Layer({
  i,
  p,
  L,
  node,
}: {
  i: number;
  p: MotionValue<number>;
  L: Layout;
  node: ReactNode;
}) {
  const T = [0, 0.565, 0.6, 0.605, 0.655, 0.7, 0.735, 1];
  const r = (i - 2.5) * 3;
  const stack = { x: L.stackAt.x + (i - 2.5) * 4, y: L.stackAt.y - i * 5 };
  const giftAt = L.stages[0];
  const box = L.layerBox[i];
  const pts = [stack, stack, stack, stack, L.grid[i], L.grid[i], giftAt, giftAt].map((q) => ({
    x: q.x - box.w / 2,
    y: q.y - box.h / 2,
  }));
  const x = useTransform(
    p,
    T,
    pts.map((q) => q.x),
    EASE,
  );
  const y = useTransform(
    p,
    T,
    pts.map((q) => q.y),
    EASE,
  );
  const scale = useTransform(p, T, [0.6, 0.6, 0.94, 0.94, 1, 1, 0.15, 0.15], EASE);
  const rotate = useTransform(p, T, [r, r, r, r, 0, 0, 0, 0], EASE);
  const opacity = useTransform(
    p,
    T,
    L.layerHidden[i] ? [0, 0, 1, 1, 0, 0, 0, 0] : [0, 0, 1, 1, 1, 1, 0, 0],
  );
  const pointerEvents = useTransform(p, (v) => (v > 0.655 && v < 0.7 ? "auto" : "none"));
  return (
    <motion.div
      style={{
        x,
        y,
        scale,
        rotate,
        opacity,
        pointerEvents,
        width: box.w,
        height: box.h,
        zIndex: 20 + (6 - i),
      }}
      className="absolute left-0 top-0 will-change-transform"
    >
      {node}
    </motion.div>
  );
}

function Pipeline({ p, L, stageIdx }: { p: MotionValue<number>; L: Layout; stageIdx: number }) {
  const opacity = useTransform(p, [0.725, 0.745, 0.85, 0.875], [0, 1, 1, 0]);
  const g = useTransform(p, [0.745, 0.845], [0, 1], EASE);
  const first = L.stages[0];
  const last = L.stages[4];
  const chipX = useTransform(g, [0, 1], [first.x, last.x]);
  const chipY = useTransform(g, [0, 1], [first.y, last.y]);
  const mobile = first.x === last.x;
  return (
    <motion.div style={{ opacity }} className="pointer-events-none absolute inset-0 z-20">
      {/* track */}
      <div
        className="absolute bg-line"
        style={
          mobile
            ? { left: 30, top: first.y, width: 2, height: last.y - first.y }
            : { left: first.x, top: first.y - 74, height: 2, width: last.x - first.x }
        }
      />
      <motion.div
        className="absolute bg-[#FE5102]"
        style={
          mobile
            ? { left: 30, top: first.y, width: 2, height: last.y - first.y, scaleY: g, originY: 0 }
            : {
                left: first.x,
                top: first.y - 74,
                height: 2,
                width: last.x - first.x,
                scaleX: g,
                originX: 0,
              }
        }
      />
      {mobile ? (
        <motion.div
          style={{ left: 31, top: chipY }}
          className="absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-paper bg-[#FE5102]"
        />
      ) : (
        <motion.div
          style={{ left: chipX, top: first.y - 73 }}
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#FE5102] px-3 py-1.5 font-gsf text-[12px] font-semibold text-white"
        >
          ₦25,000 · monthly
        </motion.div>
      )}
      {L.stages.map((q, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: q.x, top: q.y, width: L.stage.w }}
        >
          <PipelineStage index={i} active={stageIdx === i} done={stageIdx > i} />
        </div>
      ))}
    </motion.div>
  );
}

/* ─── Stage ──────────────────────────────────────────────────────────── */

export function Stage() {
  const ref = useRef<HTMLDivElement>(null);
  const vp = useViewport();
  const L = useLayout(vp);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.5,
    restDelta: 0.0005,
  });

  // Discrete states that change a few times per scene (cheap re-renders).
  const [checksDone, setChecksDone] = useState(0);
  const [stageIdx, setStageIdx] = useState(-1);
  const [hovered, setHovered] = useState<Priority | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [unread, setUnread] = useState(12);
  useMotionValueEvent(p, "change", (v) => {
    setChecksDone(Math.max(0, Math.min(6, Math.floor((v - 0.305) / 0.007))));
    setStageIdx(v < 0.745 ? -1 : Math.min(4, Math.floor(((v - 0.745) / 0.1) * 5)));
    setUnread(Math.round(12 + Math.max(0, Math.min(1, (v - 0.1) / 0.16)) * 236));
  });

  const jumpToStory = () => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: top + (el.offsetHeight - window.innerHeight) * 0.13,
      behavior: "smooth",
    });
  };

  // Hero
  const heroO = useTransform(p, [0, 0.05], [1, 0]);
  const heroY = useTransform(p, [0, 0.05], [0, -40]);
  const heroPE = useTransform(p, (v) => (v < 0.03 ? "auto" : "none"));
  const markScale = useTransform(p, [0, 0.025, 0.11], [1, 1.12, 18], EASE);
  const markRotate = useTransform(p, [0, 0.11], [0, 70]);
  const markO = useTransform(p, [0, 0.07, 0.11], [1, 1, 0]);

  // Old-way counter
  const counter = useWindow(p, 0.1, 0.27);

  // Warm build-up and the bright finale
  const peach = useTransform(p, [0.745, 0.85], [0, 1]);
  const reveal = useTransform(
    p,
    [0.855, 0.905],
    ["circle(0% at 50% 62%)", "circle(150% at 50% 62%)"],
  );
  const finaleO = useTransform(p, [0.885, 0.925], [0, 1]);
  const finaleY = useTransform(p, [0.885, 0.925], [30, 0], EASE);
  const finalePE = useTransform(p, (v) => (v > 0.9 ? "auto" : "none"));
  const markBackO = useTransform(p, [0.91, 0.95], [0, 1]);
  const markBackS = useTransform(p, [0.91, 0.95], [0.6, 1], EASE);

  const layers = campaignLayers(hoverKey, setHoverKey);

  return (
    <div ref={ref} className="relative h-[1000vh] max-md:h-[880vh]">
      <div className="sticky top-0 h-svh overflow-hidden bg-paper">
        <motion.div style={{ opacity: peach }} className="absolute inset-0 bg-peach" />

        {/* Hero */}
        <motion.img
          src={logoMark}
          alt=""
          style={{
            left: L.mark.x,
            top: L.mark.y,
            scale: markScale,
            rotate: markRotate,
            opacity: markO,
          }}
          className="absolute z-[15] h-[clamp(88px,9vw,150px)] w-[clamp(88px,9vw,150px)] -translate-x-1/2 -translate-y-1/2"
        />
        <motion.div
          style={{
            opacity: heroO,
            y: heroY,
            pointerEvents: heroPE,
            top: L.mark.y + (vp.mobile ? 64 : 92),
          }}
          className="absolute inset-x-0 z-30 mx-auto flex max-w-[960px] flex-col items-center gap-5 px-6 text-center"
        >
          <h1 className="font-display text-[clamp(40px,6.4vw,104px)] leading-[0.98] tracking-[-0.03em] text-ink">
            Stop wondering. Start seeing.
          </h1>
          <p className="max-w-[620px] font-gsf text-[clamp(16px,1.3vw,19px)] leading-[1.5] text-ink-soft">
            AzarFaith connects you to verified churches, missions and orphanages across Nigeria, and
            shows you what every gift becomes.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <Link
              to="/signup"
              className="press inline-flex items-center rounded-full border-2 border-ink bg-ink px-6 py-3 font-gsf text-base font-medium text-ink-contrast hover:opacity-90"
            >
              Start giving
            </Link>
            <button
              type="button"
              onClick={jumpToStory}
              className="press inline-flex items-center rounded-full border border-ink px-6 py-3 font-gsf text-base text-ink hover:bg-ink/5"
            >
              See how it works
            </button>
          </div>
        </motion.div>

        {/* Scene 1 */}
        <Headline p={p} range={[0.095, 0.185]} at="center">
          The problem isn&rsquo;t generosity.
        </Headline>
        <Headline p={p} range={[0.18, 0.27]} at="center">
          It&rsquo;s knowing where your gift actually goes.
        </Headline>
        <motion.div
          style={counter}
          className="absolute right-6 top-[max(84px,10vh)] z-30 rounded-full border border-line bg-paper px-3.5 py-1.5 font-gsf text-[13px] text-ink-soft max-md:left-6 max-md:right-auto"
        >
          <span className="font-semibold text-[#FE5102]">{unread}</span> unread forwarded appeals
        </motion.div>

        {/* The continuous system */}
        <CheckLines p={p} L={L} />
        {Array.from({ length: L.n }, (_, i) => (
          <Token key={i} i={i} p={p} L={L} checksDone={checksDone} hovered={hovered} />
        ))}

        {/* Scene 2 */}
        <Placed p={p} at={L.org} range={[0.285, 0.43]}>
          <OrgCard verified={checksDone >= 6} />
        </Placed>
        <Headline p={p} range={[0.285, 0.43]}>
          Every organization is verified before it receives a naira.
        </Headline>

        {/* Scene 3 */}
        <Placed p={p} at={L.giver} range={[0.43, 0.575]} z={25}>
          <GiverChip hovered={hovered} onHover={setHovered} />
        </Placed>
        <Headline
          p={p}
          range={[0.43, 0.585]}
          sub="Weak matches step back. The causes you care about come closer. Hover a priority."
        >
          Less noise. More certainty.
        </Headline>

        {/* Scene 4 */}
        {layers.map((l, i) => (
          <Layer key={l.id} i={i} p={p} L={L} node={l.node} />
        ))}
        <Headline
          p={p}
          range={[0.585, 0.72]}
          sub="The need, the budget, the receipts. Hover a budget line to find where it was spent."
        >
          See exactly what your gift is for.
        </Headline>

        {/* Scene 5 */}
        <Pipeline p={p} L={L} stageIdx={stageIdx} />
        <Headline p={p} range={[0.725, 0.87]}>
          Don&rsquo;t just give. See it arrive.
        </Headline>

        {/* Scene 6: the bright finale */}
        <motion.div style={{ clipPath: reveal }} className="absolute inset-0 z-40 bg-[#FFE228]">
          <motion.div
            style={{ opacity: finaleO, y: finaleY, pointerEvents: finalePE }}
            className="flex h-full flex-col items-center justify-center gap-6 px-6 pt-16 text-center"
          >
            <motion.img
              src={logoMark}
              alt=""
              style={{ opacity: markBackO, scale: markBackS }}
              className="h-12 w-12"
            />
            <h2 className="max-w-[1000px] font-display text-[clamp(32px,4.8vw,80px)] leading-[1.02] tracking-[-0.03em] text-[#130E30]">
              From hoping it helped to seeing that it did.
            </h2>
            <UpdateCard />
            <Link
              to="/signup"
              className="press inline-flex items-center rounded-full border-2 border-[#130E30] bg-[#130E30] px-6 py-3 font-gsf text-base font-medium text-[#EFF2E5] hover:opacity-90"
            >
              Start with AzarFaith
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
