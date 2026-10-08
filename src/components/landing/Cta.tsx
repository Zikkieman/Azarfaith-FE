import { Link } from "@tanstack/react-router";
import iconCtaArrow from "@/assets/landing/icon-cta-arrow.svg";

export function Cta() {
  return (
    <section className="flex w-full flex-col items-center bg-white px-6 py-20 md:px-12">
      <div className="flex w-full max-w-[1000px] flex-col items-center gap-7">
        <h2 className="text-center font-display text-[clamp(36px,3.7vw,64px)] leading-[1.08] tracking-[-0.01em] text-[#130E30]">
          Ready to give with confidence?
        </h2>

        <p className="max-w-[640px] text-center font-gsf text-lg leading-[27.9px] tracking-[-0.02em] text-[#4A4660]">
          Turn your generosity into lasting impact for the church, with full transparency at every
          step of the way.
        </p>

        <Link
          to="/signup"
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#130E30] px-[22px] py-3 font-gsf text-base leading-5 tracking-[-0.02em] text-[#EFF2E5] transition-opacity hover:opacity-90"
        >
          Start giving
        </Link>

        <div className="flex w-full max-w-[620px] flex-wrap items-center justify-center gap-4 border-t border-[rgba(19,14,48,0.14)] pt-[18px]">
          <span className="font-gsf text-base leading-6 tracking-[-0.02em] text-[#4A4660]">
            Not there yet?
          </span>
          <Link
            to="/discover"
            className="inline-flex items-center gap-2 rounded-full border border-[#130E30] px-[22px] py-3 font-gsf text-base leading-6 tracking-[-0.02em] text-[#130E30] transition-colors hover:bg-[#130E30]/5"
          >
            Read donor stories
            <img src={iconCtaArrow} alt="" className="h-[15px] w-[15px]" />
          </Link>
        </div>
      </div>
    </section>
  );
}
