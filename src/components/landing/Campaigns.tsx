import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { Reveal } from "@/components/motion/Reveal";
import { CampaignCard } from "@/components/CampaignCard";
import { useApp } from "@/lib/store";
import { ChevronRight } from "lucide-react";

export function Campaigns() {
  const campaigns = useApp((s) => s.campaigns);
  const featured = campaigns.filter((c) => c.verificationStatus === "verified").slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <section className="mx-auto flex w-full max-w-[1728px] flex-col px-6 py-20 sm:px-10 md:py-[clamp(96px,9vw,156px)] lg:px-[clamp(40px,8.2vw,141px)]">
      <Reveal className="flex flex-col gap-6">
        <div className="flex items-center gap-2.5">
          <h2 className="min-w-0 flex-1 font-gsf text-[clamp(26px,2.08vw,36px)] font-bold leading-[26.25px] text-heading">
            Featured campaigns
          </h2>
          <Link
            to="/discover"
            className="flex shrink-0 items-center gap-1 transition-opacity hover:opacity-70"
          >
            <span className="font-gsf text-sm font-medium leading-[26.25px] text-subtle">
              View more
            </span>
            <ChevronRight className="h-[18px] w-[18px] text-subtle" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:-mx-10 sm:px-10 md:mx-0 md:grid md:grid-cols-2 md:gap-[23px] md:overflow-visible md:px-0 xl:grid-cols-3 [&::-webkit-scrollbar]:hidden">
          {featured.map((c, i) => (
            <div
              key={c.id}
              data-stagger
              style={{ "--i": i } as CSSProperties}
              className={`w-[85%] shrink-0 snap-start sm:w-[60%] md:w-auto ${i === 2 ? "md:hidden xl:block" : ""}`}
            >
              <CampaignCard campaign={c} />
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
