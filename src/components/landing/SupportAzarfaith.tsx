import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import logoMark from "@/assets/signup/logo-mark.svg";
import { Reveal } from "@/components/motion/Reveal";

/** A direct platform gift has its own checkout and never increases a campaign total. */
export function SupportAzarfaith() {
  return (
    <section className="w-full bg-paper px-6 py-12 md:px-12 md:py-20" aria-labelledby="support-azarfaith-title">
      <Reveal className="mx-auto flex w-full max-w-[1280px] flex-col items-start gap-7 rounded-[28px] bg-[#FFE228] px-7 py-10 text-ink sm:px-10 md:flex-row md:items-center md:justify-between md:gap-10 md:px-14 md:py-14">
        <div className="flex max-w-[750px] flex-col items-start gap-4">
          <img src={logoMark} alt="" className="h-10 w-10" />
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em]">Give directly to AzarFaith</p>
          <h2 id="support-azarfaith-title" className="font-display text-[clamp(32px,3.4vw,52px)] leading-[1.08] tracking-[-0.03em]">
            Support the work behind every gift.
          </h2>
          <p className="max-w-[620px] text-[16px] leading-relaxed text-ink-soft">
            Help us keep the platform running, verify organizations, and respond to urgent causes. This donation goes to AzarFaith, separately from any campaign.
          </p>
        </div>
        <Link to="/support-azarfaith" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[15px] font-semibold text-ink-contrast transition-opacity hover:opacity-90">
          Donate to AzarFaith <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      </Reveal>
    </section>
  );
}
