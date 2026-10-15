import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { BadgeCheck, CheckCircle2, ChevronLeft, Search } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Choose a verified cause",
    body: "Browse churches, missions, orphanages and faith schools. Each one is checked before it can receive a single naira.",
  },
  {
    title: "Give once or on a schedule",
    body: "Pick an amount and give one time, weekly, monthly or quarterly. The 2.5% fee is shown before you pay.",
  },
  {
    title: "See what your gift did",
    body: "Your receipt arrives straight away. Updates, photos and spending receipts follow in your giving history.",
  },
];

/** Scroll distance (svh) each step holds the stage for. */
const STEP_SVH = 30;

/* ---------- Phone screens ---------- */

function ScreenHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-panel text-ink">
        <ChevronLeft className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className="text-[14px] font-medium text-heading">{title}</span>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-panel text-[14px] font-semibold text-ink">
        ?
      </span>
    </div>
  );
}

function DiscoverScreen() {
  const orgs = useApp((s) => s.orgs);
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Discover" />
      <div className="flex items-center gap-2 rounded-full bg-panel px-4 py-2.5 text-[13px] text-muted-ink">
        <Search className="h-4 w-4" strokeWidth={1.75} /> Search causes
      </div>
      <ul className="flex flex-col gap-1">
        {orgs.slice(0, 5).map((o, i) => (
          <li
            key={o.id}
            className={cn("flex items-center gap-3 rounded-2xl p-2", i === 0 && "bg-panel")}
          >
            <img src={o.photos[0]} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 text-[14px] font-semibold text-heading">
                <span className="truncate">{o.name}</span>
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#00B67A]" strokeWidth={2} />
              </span>
              <span className="block truncate text-[12px] text-muted-ink">{o.location}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const TYPED = ["₦0", "₦2", "₦25", "₦250", "₦2,500", "₦25,000"];
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""];
const PRESSED = ["", "2", "5", "0", "0", "0"];

function GiveScreen({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  const campaign = useApp(
    (state) => state.campaigns.find((item) => item.verificationStatus === "verified") ?? state.campaigns[0],
  );
  const [n, setN] = useState(TYPED.length - 1);

  // Types the amount in, one key at a time, each time this screen comes up.
  useEffect(() => {
    if (!active || reduce) return;
    setN(0);
    let i = 0;
    const t = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= TYPED.length - 1) window.clearInterval(t);
    }, 240);
    return () => window.clearInterval(t);
  }, [active, reduce]);

  const done = n >= TYPED.length - 1;
  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader title="Give" />
      <p className="flex items-center justify-center gap-1.5 text-[13px] text-muted-ink">
        {campaign?.title ?? "A verified cause"}
        <BadgeCheck className="h-3.5 w-3.5 text-[#00B67A]" strokeWidth={2} />
      </p>
      <p className="py-4 text-center font-display text-[clamp(40px,4vw,54px)] leading-none tracking-[-0.04em] text-ink">
        {TYPED[n]}
      </p>
      <div className="flex justify-center gap-5 text-[13px]">
        {["One time", "Weekly", "Monthly"].map((f) => (
          <span
            key={f}
            className={cn(
              "pb-1",
              f === "Monthly" ? "border-b-2 border-ink font-semibold text-ink" : "text-muted-ink",
            )}
          >
            {f}
          </span>
        ))}
      </div>
      <p
        className={cn(
          "text-center text-[12px] text-muted-ink transition-opacity duration-300",
          done ? "opacity-100" : "opacity-0",
        )}
      >
        Platform fee (2.5%): ₦625, shown before you pay
      </p>
      <div className="grid grid-cols-3 gap-y-1 pt-2 text-center font-gsf text-[22px] font-medium text-ink">
        {KEYS.map((k, i) => (
          <span
            key={i}
            className={cn(
              "mx-auto grid h-12 w-16 place-items-center rounded-2xl transition-colors duration-150",
              k && k === PRESSED[n] && !done ? "bg-panel" : "",
            )}
          >
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}

function ReceiptScreen() {
  const campaign = useApp(
    (state) => state.campaigns.find((item) => item.verificationStatus === "verified") ?? state.campaigns[0],
  );
  const org = useApp((state) =>
    campaign?.orgId ? state.orgs.find((item) => item.id === campaign.orgId) : undefined,
  );
  const update = campaign?.updates[0];
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Giving history" />
      <div className="flex flex-col gap-1 rounded-2xl border border-line-soft p-4">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#00875A]">
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} /> Receipt sent
        </span>
        <span className="text-[15px] font-semibold text-heading">
          {campaign ? `₦25,000 to ${org?.name ?? campaign.title}` : "Your gift receipt will appear here"}
        </span>
        <span className="text-[12px] text-muted-ink">Monthly, next on 1 November</span>
      </div>
      {update?.body ? (
        <div className="flex flex-col gap-2.5">
          <span className="text-[12px] font-medium text-muted-ink">Latest update</span>
          <span className="text-[15px] leading-[21px] text-heading">{update.body}</span>
        </div>
      ) : null}
    </div>
  );
}

/** A phone outline whose screen crossfades to the active step; the bottom fades away. */
function Phone({ step, className }: { step: number; className?: string }) {
  const screens: ReactNode[] = [
    <DiscoverScreen key="d" />,
    <GiveScreen key="g" active={step === 1} />,
    <ReceiptScreen key="r" />,
  ];
  return (
    <div
      className={cn("px-8 pt-8", className)}
      style={{
        maskImage: "linear-gradient(to bottom, #000 72%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, #000 72%, transparent)",
      }}
      aria-hidden
    >
      <div className="relative h-full overflow-hidden rounded-[40px] border border-line-soft bg-paper shadow-[0_30px_110px_-30px_rgba(19,14,48,0.28)]">
        {screens.map((screen, i) => (
          <div
            key={i}
            className={cn(
              "absolute inset-0 px-5 pt-6 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
              step === i ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0",
            )}
          >
            {screen}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Step list ---------- */

/** How much of step `i`'s rule is filled: it tracks scroll while that step is active. */
function useFill(progress: MotionValue<number>, i: number) {
  return useTransform(progress, (v) => {
    const x = v * steps.length - i;
    if (i === steps.length - 1 && x >= 1) return 1;
    return x >= 0 && x < 1 ? x : 0;
  });
}

function StepItem({
  i,
  active,
  progress,
  onSelect,
}: {
  i: number;
  active: boolean;
  progress: MotionValue<number>;
  onSelect: (i: number) => void;
}) {
  const fill = useFill(progress, i);
  const step = steps[i];
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(i)}
        aria-current={active ? "step" : undefined}
        className="relative block w-full py-1 pl-6 text-left"
      >
        <span aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-line" />
        <motion.span
          aria-hidden
          style={{ scaleY: fill }}
          className="absolute inset-y-0 left-0 w-[2px] origin-top bg-[#FE5102]"
        />
        <span
          className={cn(
            "flex flex-col gap-1.5 transition-opacity duration-300",
            active ? "opacity-100" : "opacity-40 hover:opacity-70",
          )}
        >
          <span className="font-gsf text-[clamp(18px,1.3vw,21px)] font-semibold leading-[1.3] text-heading">
            {step.title}
          </span>
          <span className="max-w-[440px] font-gsf text-base leading-[1.55] tracking-[-0.01em] text-ink-soft">
            {step.body}
          </span>
        </span>
      </button>
    </li>
  );
}

/** Phones: three short bars across, filling with scroll like the desktop rules. */
function StepBar({
  i,
  progress,
  onSelect,
}: {
  i: number;
  progress: MotionValue<number>;
  onSelect: (i: number) => void;
}) {
  const fill = useFill(progress, i);
  return (
    <li className="flex-1">
      <button
        type="button"
        onClick={() => onSelect(i)}
        aria-label={steps[i].title}
        className="relative block h-[3px] w-full overflow-hidden rounded-full bg-line"
      >
        <motion.span
          aria-hidden
          style={{ scaleX: fill }}
          className="absolute inset-0 origin-left bg-[#FE5102]"
        />
      </button>
    </li>
  );
}

/**
 * "How giving works", pattern from Goldsand: the stage pins, scrolling walks through the steps
 * while the phone shows each one, and the active step's rule fills with the scroll.
 */
export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setStep(Math.min(steps.length - 1, Math.max(0, Math.floor(v * steps.length))));
  });

  const select = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: top + (range * (i + 0.15)) / steps.length,
      behavior: smooth ? "smooth" : "auto",
    });
  };

  return (
    <section id="how-it-works" className="scroll-mt-20 bg-paper">
      <div
        ref={ref}
        className="relative px-6 sm:px-10 lg:px-[clamp(40px,8.2vw,141px)]"
        style={{ height: `calc(100svh + ${steps.length * STEP_SVH}svh)` }}
      >
        <div className="sticky top-0 mx-auto flex h-svh w-full max-w-[1200px] flex-col justify-center gap-5 py-8 md:grid md:grid-cols-2 md:items-center md:gap-16">
          <div className="flex flex-col gap-4 md:gap-10">
            <h2 className="font-display text-[clamp(30px,3.2vw,56px)] leading-[1.08] tracking-[-0.03em] text-ink">
              How giving works
            </h2>
            <ol className="hidden flex-col gap-8 md:flex">
              {steps.map((s, i) => (
                <StepItem
                  key={s.title}
                  i={i}
                  active={step === i}
                  progress={scrollYProgress}
                  onSelect={select}
                />
              ))}
            </ol>
          </div>

          <Phone
            step={step}
            className="mx-auto h-[min(440px,50svh)] w-[min(330px,84vw)] md:h-[min(600px,74svh)] md:w-[min(450px,100%)]"
          />

          {/* Phones: progress bars, then the active step's words. */}
          <div className="flex flex-col gap-4 md:hidden">
            <ol className="flex gap-2">
              {steps.map((s, i) => (
                <StepBar key={s.title} i={i} progress={scrollYProgress} onSelect={select} />
              ))}
            </ol>
            <div className="relative min-h-[120px]">
              {steps.map((s, i) => (
                <div
                  key={s.title}
                  aria-hidden={step !== i}
                  className={cn(
                    "absolute inset-x-0 top-0 flex flex-col gap-1.5 transition-opacity duration-300",
                    step === i ? "opacity-100" : "opacity-0",
                  )}
                >
                  <span className="font-gsf text-lg font-semibold text-heading">{s.title}</span>
                  <span className="font-gsf text-[15px] leading-[1.55] text-ink-soft">
                    {s.body}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
