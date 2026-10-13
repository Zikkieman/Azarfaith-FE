import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  easeInOut,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import logoMark from "@/assets/signup/logo-mark.svg";
import { useLandingData as useApp } from "./data";
import { CampaignCard } from "./CampaignCard";
import { FruitCycler } from "./FruitCycler";
import { formatCompactMoney } from "./design-preview";

const EASE = { ease: easeInOut };
const CAMPAIGN_ID = "gfc5";

function HeroCopy() {
  return (
    <>
      <h1 className="font-display text-[clamp(40px,6.4vw,104px)] leading-[0.98] tracking-[-0.03em] text-ink">
        <span className="block">You give in faith.</span>
        <span className="block">
          See the <FruitCycler />.
        </span>
      </h1>
      <p className="max-w-[640px] text-pretty font-gsf text-[clamp(16px,1.3vw,19px)] leading-[1.5] text-ink-soft">
        Give to verified churches, missions and orphanages across Nigeria, and get the receipt, the
        update and the photos for every gift.
      </p>
      <div className="flex flex-wrap justify-center gap-3 pt-1">
        <Link
          to="/signup"
          search={{ mode: "choose", returnTo: undefined }}
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
  const c = useApp((s) => s.campaigns.find((x) => x.id === CAMPAIGN_ID) ?? s.campaigns[0]);
  if (!c) return null;
  return (
    <div className="w-[min(440px,88vw)]">
      <CampaignCard campaign={c} compact />
    </div>
  );
}

function Finale() {
  const { mapTotals, mapPreview } = useApp((s) => s);
  return (
    <>
      <img src={logoMark} alt="" className="h-10 w-10 md:h-12 md:w-12" />
      <h2 className="max-w-[1100px] font-display text-[clamp(28px,min(4.4vw,7vh),76px)] leading-[1.04] tracking-[-0.03em] text-[#130E30]">
        {mapPreview
          ? "More than ₦35 million is given every week on AzarFaith.*"
          : `${formatCompactMoney(mapTotals.givenWeek)} given in the last seven days on AzarFaith.*`}
      </h2>
      <CampaignShowcase />
      <Link
        to="/signup"
        search={{ mode: "choose", returnTo: undefined }}
        className="press inline-flex items-center rounded-full border-2 border-[#130E30] bg-[#130E30] px-6 py-3 font-gsf text-base font-medium text-[#EFF2E5] hover:opacity-90"
      >
        Start with AzarFaith
      </Link>
      <p className="font-gsf text-[12px] text-[#4A4660]">
        {mapPreview
          ? "*Design preview: sample weekly figure, not a live total."
          : "*Confirmed gifts to currently published campaigns."}
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Match SSR first; mount scroll observers only when their animated target exists.
  if (mounted && reduce) {
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
  return <AnimatedOpening />;
}

function AnimatedOpening() {
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
