import { useState } from "react";
import { Link } from "@tanstack/react-router";
import logoMark from "@/assets/signup/logo-mark.svg";
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

const h2 = "font-display text-[clamp(32px,4.4vw,72px)] leading-[1.04] tracking-[-0.03em] text-ink";
const scene = "flex flex-col items-center gap-10 px-6 py-24 text-center md:py-32";

/** The whole story without motion: every scene in its resolved state, read top to bottom. */
export function StaticStory() {
  const [hovered, setHovered] = useState<Priority | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  return (
    <div>
      <section className={`${scene} pt-36`}>
        <img src={logoMark} alt="" className="h-24 w-24" />
        <h1 className="font-display text-[clamp(40px,6.4vw,104px)] leading-[0.98] tracking-[-0.03em] text-ink">
          Stop wondering. Start seeing.
        </h1>
        <p className="max-w-[620px] font-gsf text-lg text-ink-soft">
          AzarFaith connects you to verified churches, missions and orphanages across Nigeria, and
          shows you what every gift becomes.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center rounded-full border-2 border-ink bg-ink px-6 py-3 font-gsf text-base font-medium text-ink-contrast"
        >
          Start giving
        </Link>
      </section>

      <section className={`${scene} bg-panel`}>
        <h2 className={h2}>
          The problem isn&rsquo;t generosity. It&rsquo;s knowing where your gift actually goes.
        </h2>
        <div className="grid w-full max-w-[1100px] grid-cols-2 gap-3 md:grid-cols-4">
          {appeals.slice(0, 8).map((a) => (
            <div key={a.text} className="h-[66px]">
              <AppealCard {...a} />
            </div>
          ))}
        </div>
      </section>

      <section className={scene}>
        <h2 className={h2}>Every organisation is verified before it receives a naira.</h2>
        <OrgCard verified />
        <div className="grid w-full max-w-[760px] gap-3 sm:grid-cols-2 md:grid-cols-3">
          {checks.map((c) => (
            <div key={c} className="h-11">
              <CheckNode label={c} done />
            </div>
          ))}
        </div>
      </section>

      <section className={`${scene} bg-panel`}>
        <h2 className={h2}>Less noise. More certainty.</h2>
        <GiverChip hovered={hovered} onHover={setHovered} />
        <div className="grid w-full max-w-[900px] gap-3 sm:grid-cols-2 md:grid-cols-3">
          {causes
            .filter((c) => c.strong)
            .map((c) => (
              <div key={c.name} className="h-[66px]">
                <CauseCard {...c} highlighted={!!hovered && c.tags.includes(hovered)} />
              </div>
            ))}
        </div>
      </section>

      <section className={scene}>
        <h2 className={h2}>See exactly what your gift is for.</h2>
        <div className="grid w-full max-w-[860px] gap-4 sm:grid-cols-2 md:grid-cols-3">
          {campaignLayers(hoverKey, setHoverKey).map((l) => (
            <div key={l.id} className="h-[190px] text-left">
              {l.node}
            </div>
          ))}
        </div>
      </section>

      <section className={`${scene} bg-peach`}>
        <h2 className={h2}>Don&rsquo;t just give. See it arrive.</h2>
        <div className="grid w-full max-w-[1100px] gap-3 text-left md:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <PipelineStage key={i} index={i} active={i === 4} done={i < 4} />
          ))}
        </div>
      </section>

      <section className={`${scene} bg-[#FFE228]`}>
        <img src={logoMark} alt="" className="h-12 w-12" />
        <h2 className="max-w-[1000px] font-display text-[clamp(32px,4.4vw,72px)] leading-[1.04] text-[#130E30]">
          From hoping it helped to seeing that it did.
        </h2>
        <UpdateCard />
      </section>
    </div>
  );
}
