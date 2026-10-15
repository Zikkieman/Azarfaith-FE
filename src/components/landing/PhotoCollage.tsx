import { Fragment, useRef, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import logoMark from "@/assets/signup/logo-mark.svg";

const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=700&q=80`;

type Shot = {
  src: string;
  alt: string;
  /** Position as a percentage of the pinned stage. */
  left: number;
  top: number;
  /** Width in vw, also capped by viewport height and a pixel maximum. */
  w: number;
  ratio: string;
  /** How far (px) the photo travels while the stage is pinned. */
  drift: number;
  z?: number;
  /** Sits close to the statement, so it is dropped on narrow or short screens. */
  crowds?: boolean;
};

/** Scattered documentary photos around the statement (pattern borrowed from Lassie). */
const photos: Shot[] = [
  {
    src: unsplash("1694286068611-d0c24cbc2cd5"),
    alt: "Church members sharing a meal",
    left: 51,
    top: 2,
    w: 17,
    ratio: "4/3",
    drift: 50,
  },
  {
    src: unsplash("1553775927-a071d5a6a39a"),
    alt: "Women carrying water home",
    left: 72,
    top: 18,
    w: 13,
    ratio: "1/1",
    drift: 90,
  },
  {
    src: unsplash("1609532587710-b00027c0594b"),
    alt: "A church building in Nigeria",
    left: 15,
    top: 20,
    w: 11,
    ratio: "4/5",
    drift: 70,
  },
  {
    src: unsplash("1521493959102-bdd6677fdd81"),
    alt: "Children at a classroom window",
    left: 4,
    top: 35,
    w: 16,
    ratio: "5/4",
    drift: 40,
    z: 2,
  },
  {
    src: unsplash("1536064479547-7ee40b74b807"),
    alt: "A doctor at a medical mission",
    left: 80,
    top: 52,
    w: 15,
    ratio: "1/1",
    drift: 60,
  },
  {
    src: unsplash("1604072366376-63d46248927e"),
    alt: "A congregation in worship",
    left: 24,
    top: 72,
    w: 14,
    ratio: "1/1",
    drift: 85,
    crowds: true,
  },
  {
    src: unsplash("1523396140703-e5bdad4e5dea"),
    alt: "A schoolgirl with her book",
    left: 40,
    top: 82,
    w: 16,
    ratio: "3/2",
    drift: 45,
    crowds: true,
  },
  {
    src: unsplash("1509099927777-1b8a87bc3b21"),
    alt: "Children smiling",
    left: 69,
    top: 74,
    w: 15,
    ratio: "7/5",
    drift: 75,
  },
];

const HEADLINE = "Your gift, your impact. Verified by your org. Shared with every giver.";
const BODY =
  "One giving history for every church, missionary and faith-based organization you support, so you always know exactly where your money went.";

type Ranges = { headline: [number, number]; body: [number, number]; cta: [number, number] };

/** One word that inks in as the reader scrolls through its slice of `range`. */
function Word({
  progress,
  range,
  children,
}: {
  progress: MotionValue<number>;
  range: [number, number];
  children: ReactNode;
}) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return <motion.span style={{ opacity }}>{children}</motion.span>;
}

/** Text that reads itself in, word by word, as `progress` moves across `range`. */
function ReadingText({
  text,
  progress,
  range: [from, to],
}: {
  text: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const words = text.split(" ");
  const step = (to - from) / words.length;
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((word, i) => (
          <Fragment key={i}>
            <Word progress={progress} range={[from + i * step, from + (i + 2) * step]}>
              {word}
            </Word>{" "}
          </Fragment>
        ))}
      </span>
    </>
  );
}

function Statement({
  progress,
  ranges,
  className = "",
}: {
  progress: MotionValue<number>;
  ranges: Ranges;
  className?: string;
}) {
  const ctaO = useTransform(progress, ranges.cta, [0, 1]);
  const ctaY = useTransform(progress, ranges.cta, [12, 0]);
  return (
    <div className={`flex flex-col items-center gap-6 text-center ${className}`}>
      <img src={logoMark} alt="" className="h-16 w-16 md:h-20 md:w-20" />
      <h2 className="font-display text-[clamp(32px,min(3.4vw,5.8vh),58px)] font-medium leading-[1.1] tracking-[-0.03em] text-ink">
        <ReadingText text={HEADLINE} progress={progress} range={ranges.headline} />
      </h2>
      <p className="max-w-[520px] font-gsf text-lg leading-[1.55] tracking-[-0.02em] text-ink-soft">
        <ReadingText text={BODY} progress={progress} range={ranges.body} />
      </p>
      <motion.div style={{ opacity: ctaO, y: ctaY }}>
        <Link
          to="/signup"
          search={{}}
          className="press inline-flex items-center rounded-full border-2 border-ink bg-ink px-6 py-3 font-gsf text-base font-medium text-ink-contrast hover:opacity-90"
        >
          Start giving
        </Link>
      </motion.div>
    </div>
  );
}

/** A photo that settles in from slightly further out and drifts up while pinned. */
function DriftingPhoto({ shot, progress }: { shot: Shot; progress: MotionValue<number> }) {
  const dx = shot.left + shot.w / 2 - 50;
  const x = useTransform(progress, [0, 1], [`${dx * 0.16}vw`, `${dx * -0.03}vw`]);
  const y = useTransform(progress, [0, 1], [shot.drift, shot.drift * -0.7]);
  const scale = useTransform(progress, [0, 0.55, 1], [0.8, 1, 1.04]);
  return (
    <motion.img
      src={shot.src}
      alt={shot.alt}
      loading="lazy"
      decoding="async"
      style={{
        x,
        y,
        scale,
        left: `${shot.left}%`,
        top: `${shot.top}%`,
        width: `min(${shot.w}vw, ${shot.w * 1.5}vh, ${Math.round(shot.w * 17)}px)`,
        aspectRatio: shot.ratio,
        zIndex: shot.z ?? 1,
      }}
      className={`absolute rounded-[22px] object-cover ${
        shot.crowds ? "max-lg:hidden [@media(max-height:720px)]:hidden" : ""
      }`}
    />
  );
}

/** Desktop: the stage pins while the statement reads itself in and the photos drift. */
function PinnedCollage({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.0005 });
  const still = useMotionValue(1);
  const progress = reduce ? still : smooth;

  return (
    <div ref={ref} className={`relative hidden md:block ${reduce ? "h-svh" : "h-[240vh]"}`}>
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="relative mx-auto h-full max-w-[1600px]">
          {photos.map((shot) => (
            <DriftingPhoto key={shot.src} shot={shot} progress={progress} />
          ))}
          <Statement
            progress={progress}
            ranges={{ headline: [0.36, 0.7], body: [0.68, 0.86], cta: [0.84, 0.92] }}
            className="absolute inset-0 z-10 m-auto h-fit w-[min(780px,46vw)]"
          />
        </div>
      </div>
    </div>
  );
}

/** Phones: the statement reads in as it passes, then two photo columns at different speeds. */
function StackedCollage({ reduce }: { reduce: boolean }) {
  const textRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: read } = useScroll({
    target: textRef,
    offset: ["start 0.85", "end 0.5"],
  });
  const { scrollYProgress: pass } = useScroll({
    target: gridRef,
    offset: ["start end", "end start"],
  });
  const still = useMotionValue(1);
  const leftY = useTransform(pass, [0, 1], [20, -20]);
  const rightY = useTransform(pass, [0, 1], [70, -50]);
  const columns = [photos.slice(0, 3), photos.slice(3, 6)];

  return (
    <div className="flex flex-col gap-12 px-6 py-20 md:hidden">
      <div ref={textRef}>
        <Statement
          progress={reduce ? still : read}
          ranges={{ headline: [0, 0.62], body: [0.6, 0.92], cta: [0.88, 1] }}
        />
      </div>
      <div ref={gridRef} className="grid grid-cols-2 gap-3">
        {columns.map((col, c) => (
          <motion.div
            key={c}
            style={reduce ? undefined : { y: c ? rightY : leftY }}
            className="flex flex-col gap-3"
          >
            {col.map((shot, i) => (
              <img
                key={shot.src}
                src={shot.src}
                alt={shot.alt}
                loading="lazy"
                decoding="async"
                className="w-full rounded-2xl object-cover"
                style={{ aspectRatio: (i + c) % 2 ? "1/1" : "4/5" }}
              />
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function PhotoCollage() {
  const reduce = useReducedMotion() ?? false;
  return (
    <section className="relative bg-panel">
      <PinnedCollage reduce={reduce} />
      <StackedCollage reduce={reduce} />
    </section>
  );
}
