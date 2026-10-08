import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  easeInOut,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { BadgeCheck } from "lucide-react";
import logoMark from "@/assets/signup/logo-mark.svg";
import { useApp } from "@/lib/store";
import { formatMoney } from "@/lib/mock";

const EASE = { ease: easeInOut };
const CAMPAIGN_ID = "gfc5";
const PHOTO =
  "https://images.unsplash.com/photo-1710093072218-0024b8391475?auto=format&fit=crop&w=900&q=80";

function HeroCopy() {
  return (
    <>
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
        <a
          href="#how-it-works"
          className="press inline-flex items-center rounded-full border border-ink px-6 py-3 font-gsf text-base text-ink hover:bg-ink/5"
        >
          See how it works
        </a>
      </div>
    </>
  );
}

function CampaignShowcase() {
  const c = useApp((s) => s.campaigns.find((x) => x.id === CAMPAIGN_ID));
  if (!c) return null;
  const pct = c.goal ? Math.min(100, Math.round((c.raised / c.goal) * 100)) : 0;
  return (
    <Link
      to="/campaign/$id"
      params={{ id: c.id }}
      className="group block w-[min(440px,88vw)] overflow-hidden rounded-2xl border border-[#130E30]/10 bg-white text-left"
    >
      <img src={PHOTO} alt="" className="aspect-[2/1] max-h-[24vh] w-full object-cover" />
      <div className="flex flex-col gap-2.5 p-4 md:p-5">
        <p className="flex items-center gap-1.5 font-gsf text-[13px] text-[#667085]">
          <BadgeCheck className="h-4 w-4 text-[#00B67A]" strokeWidth={1.5} />
          Grace Harvest Orphanage · Jos
        </p>
        <p className="font-gsf text-[17px] font-semibold leading-[24px] text-[#130E30] group-hover:underline">
          {c.title}
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-[#EBECEC]">
          <div className="h-2 rounded-full bg-[#FE5102]" style={{ width: `${pct}%` }} />
        </div>
        <p className="font-gsf text-[13px] text-[#667085]">
          <span className="font-semibold text-[#130E30]">{formatMoney(c.raised)}</span> raised of{" "}
          {c.goal ? formatMoney(c.goal) : ""} · {c.donors} givers
        </p>
      </div>
    </Link>
  );
}

function Finale() {
  return (
    <>
      <img src={logoMark} alt="" className="h-10 w-10 md:h-12 md:w-12" />
      <h2 className="max-w-[1100px] font-display text-[clamp(28px,min(4.4vw,7vh),76px)] leading-[1.04] tracking-[-0.03em] text-[#130E30]">
        More than ₦35 million is given every week on AzarFaith.*
      </h2>
      <CampaignShowcase />
      <Link
        to="/signup"
        className="press inline-flex items-center rounded-full border-2 border-[#130E30] bg-[#130E30] px-6 py-3 font-gsf text-base font-medium text-[#EFF2E5] hover:opacity-90"
      >
        Start with AzarFaith
      </Link>
      <p className="font-gsf text-[12px] text-[#4A4660]">
        *Weekly average across verified organisations.
      </p>
    </>
  );
}

/**
 * Homepage opening, borrowed from /story: the hero's mark expands and spins away while the
 * yellow finale opens from the centre with the weekly-giving headline and a live campaign.
 */
export function HomeOpening() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.5,
    restDelta: 0.0005,
  });

  const heroO = useTransform(p, [0, 0.22], [1, 0]);
  const heroY = useTransform(p, [0, 0.22], [0, -48], EASE);
  const heroPE = useTransform(p, (v) => (v < 0.12 ? "auto" : "none"));
  const markScale = useTransform(p, [0, 0.08, 0.5], [1, 1.12, 16], EASE);
  const markRotate = useTransform(p, [0, 0.5], [0, 75]);
  const markO = useTransform(p, [0, 0.3, 0.5], [1, 1, 0]);
  const reveal = useTransform(
    p,
    [0.28, 0.6],
    ["circle(0% at 50% 34%)", "circle(150% at 50% 34%)"],
    EASE,
  );
  const finaleO = useTransform(p, [0.5, 0.68], [0, 1]);
  const finaleY = useTransform(p, [0.5, 0.68], [36, 0], EASE);
  const finalePE = useTransform(p, (v) => (v > 0.55 ? "auto" : "none"));

  if (reduce) {
    return (
      <>
        <section className="flex flex-col items-center gap-6 bg-paper px-6 pb-24 pt-20 text-center">
          <img src={logoMark} alt="" className="h-24 w-24" />
          <HeroCopy />
        </section>
        <section className="flex flex-col items-center gap-6 bg-[#FFE228] px-6 py-24 text-center">
          <Finale />
        </section>
      </>
    );
  }

  return (
    <div ref={ref} className="relative h-[280vh]">
      <div className="sticky top-0 h-svh overflow-hidden bg-paper">
        <motion.img
          src={logoMark}
          alt=""
          style={{ scale: markScale, rotate: markRotate, opacity: markO }}
          className="absolute left-1/2 top-[30%] z-10 h-[clamp(88px,9vw,150px)] w-[clamp(88px,9vw,150px)] -translate-x-1/2 -translate-y-1/2"
        />
        <motion.div
          style={{ opacity: heroO, y: heroY, pointerEvents: heroPE }}
          className="absolute inset-x-0 top-[calc(30%+clamp(64px,6vw,96px))] z-20 mx-auto flex max-w-[960px] flex-col items-center gap-5 px-6 text-center"
        >
          <HeroCopy />
        </motion.div>

        <motion.div style={{ clipPath: reveal }} className="absolute inset-0 z-30 bg-[#FFE228]">
          <motion.div
            style={{ opacity: finaleO, y: finaleY, pointerEvents: finalePE }}
            className="flex h-full flex-col items-center justify-center gap-4 px-6 pt-14 text-center md:gap-5"
          >
            <Finale />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
