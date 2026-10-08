import { Link } from "@tanstack/react-router";
import heroImage from "@/assets/landing/hero.jpg";

export function Hero() {
  return (
    <section className="w-full overflow-hidden bg-white">
      <div className="mx-auto w-full max-w-[1728px]">
        <div className="px-6 pt-12 sm:px-10 md:pt-[clamp(56px,5vw,87px)] lg:pl-[46px] lg:pr-12">
          <h1 className="max-w-[1169px] font-display text-[clamp(44px,7.4vw,128px)] leading-[0.89] tracking-[-0.0096em] text-[#232323]">
            Give to those doing God&apos;s work
          </h1>
        </div>

        <div className="mt-10 grid grid-cols-1 md:mt-[43px] lg:grid-cols-[minmax(0,864fr)_minmax(0,876fr)]">
          <div className="bg-[#FE5102] lg:min-h-[clamp(520px,40.2vw,695px)]">
            <div className="flex h-full flex-col justify-between gap-10 px-6 py-10 sm:px-10 sm:py-12 lg:px-[clamp(40px,4.1vw,71px)] lg:pb-[clamp(48px,4.2vw,72px)] lg:pt-[clamp(40px,3.5vw,61px)]">
              <p className="max-w-[491px] font-gsf text-[clamp(22px,2.32vw,40px)] font-medium leading-[1.275] text-[#232323]">
                Create your free account and support churches, missionaries, and faith-based
                organizations across Nigeria.
              </p>

              <div className="flex flex-col gap-[11px] sm:flex-row sm:flex-wrap">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-[9px] rounded-[18px] bg-black px-8 py-[21px] font-gsf text-[17px] font-semibold leading-[18px] text-white transition-opacity hover:opacity-90 lg:py-[23px]"
                >
                  Continue with Email
                </Link>
                <Link
                  to="/discover"
                  className="inline-flex items-center justify-center gap-[9px] rounded-[18px] border-2 border-white px-8 py-[21px] font-gsf text-[17px] font-semibold leading-[18px] text-white transition-colors hover:bg-white/10 lg:py-[23px]"
                >
                  Browse causes
                </Link>
              </div>
            </div>
          </div>

          <div className="relative h-[300px] sm:h-[420px] lg:h-auto">
            <img
              src={heroImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
