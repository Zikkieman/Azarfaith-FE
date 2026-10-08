import { Link } from "@tanstack/react-router";
import yellowImage from "@/assets/landing/yellow.jpg";

const headingLines = [
  "Your gift, your impact.",
  "Verified by your org.",
  "Shared with every giver.",
];

export function YellowPanel() {
  return (
    <section className="flex w-full flex-col overflow-hidden lg:flex-row lg:items-stretch">
      <div className="flex w-full flex-col justify-center bg-[#FFE228] px-8 py-16 lg:h-[1059px] lg:w-[868px] lg:shrink-0 lg:py-0 lg:pl-24 lg:pr-8">
        <div className="flex flex-col gap-[27.9px]">
          <p className="font-gsf text-sm font-semibold uppercase leading-[21px] tracking-[0.1em] text-[#130E30]">
            The transparency &amp; giving platform
          </p>

          <div className="flex flex-col">
            {headingLines.map((line) => (
              <div key={line} className="py-2">
                <h2 className="font-display text-[clamp(30px,2.78vw,48px)] leading-[1.14] tracking-[-0.01em] text-[#130E30]">
                  {line}
                </h2>
              </div>
            ))}
          </div>

          <p className="max-w-[520px] font-gsf text-base leading-[25.6px] tracking-[-0.02em] text-[#4A4660]">
            One giving history for every church, missionary, and faith-based organization you
            support. So you always know exactly where your money went.
          </p>

          <div>
            <Link
              to="/discover"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#130E30] px-[22px] py-3 font-gsf text-base leading-5 tracking-[-0.02em] text-[#EFF2E5] transition-opacity hover:opacity-90"
            >
              Start giving
            </Link>
          </div>
        </div>
      </div>

      <div className="relative hidden h-[1059px] min-w-0 flex-1 lg:block">
        <img
          src={yellowImage}
          alt=""
          className="absolute left-[-45.55px] top-[221px] h-[640px] w-[500px] rounded-[20px] object-cover"
        />
        <img
          src={yellowImage}
          alt=""
          className="absolute left-[482.45px] top-[221px] h-[640px] w-[500px] rounded-[20px] object-cover"
        />
      </div>
    </section>
  );
}
