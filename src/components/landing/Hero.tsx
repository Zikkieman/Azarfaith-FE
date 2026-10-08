import { Link } from "@tanstack/react-router";
import heroImage from "@/assets/landing/hero.jpg";

export function Hero() {
  return (
    <section className="w-full overflow-hidden bg-white">
      <div className="mx-auto w-full max-w-[1728px]">
        <div className="px-6 pt-14 md:pl-[46px] md:pr-12 md:pt-[87px]">
          <h1 className="max-w-[1169px] font-display text-[clamp(44px,7.4vw,128px)] leading-[0.89] tracking-[-0.0096em] text-[#232323]">
            Give to those doing God&apos;s work
          </h1>
        </div>

        <div className="mt-10 grid grid-cols-1 md:mt-[43px] lg:grid-cols-[minmax(0,864fr)_minmax(0,876fr)]">
          <div className="relative bg-[#FE5102] lg:h-[695px]">
            <div className="flex h-full flex-col justify-between px-7 py-10 lg:block lg:px-0 lg:py-0">
              <p className="font-gsf text-[clamp(24px,2.32vw,40px)] font-medium leading-[1.275] text-[#232323] lg:absolute lg:left-[71px] lg:top-[61px] lg:w-[491px]">
                Create your free account and support churches, missionaries, and faith-based
                organizations across Nigeria.
              </p>

              <div className="mt-8 flex flex-wrap gap-[11px] lg:absolute lg:left-[71px] lg:top-[561px] lg:mt-0">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-[9px] rounded-[18px] bg-black px-8 py-[23px] font-gsf text-[17px] font-semibold leading-[18px] text-white transition-opacity hover:opacity-90"
                >
                  Continue with Email
                </Link>
                <Link
                  to="/discover"
                  className="inline-flex items-center justify-center gap-[9px] rounded-[18px] border-2 border-white px-8 py-[23px] font-gsf text-[17px] font-semibold leading-[18px] text-white transition-colors hover:bg-white/10"
                >
                  Browse causes
                </Link>
              </div>
            </div>
          </div>

          <div className="h-[280px] sm:h-[380px] lg:h-[695px]">
            <img src={heroImage} alt="" className="h-full w-full object-cover object-center" />
          </div>
        </div>
      </div>
    </section>
  );
}
