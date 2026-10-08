import { Link } from "@tanstack/react-router";
import cover from "@/assets/landing/campaign-cover.png";
import iconVerified from "@/assets/landing/icon-verified.svg";
import iconChevron from "@/assets/landing/icon-chevron-down.svg";

function CampaignCard() {
  return (
    <article className="w-full shrink-0 rounded-xl border border-[rgba(57,62,70,0.08)] bg-white p-6 md:w-[467px]">
      <div className="relative h-[240px] w-full overflow-hidden rounded-lg">
        <img src={cover} alt="" className="h-full w-full object-cover" />
        <span className="absolute left-3.5 top-3.5 rounded-[25px] bg-[#F8F8F8]/80 px-2 py-1 font-gsf text-sm capitalize leading-5 text-black">
          Church
        </span>
        <span className="absolute left-2 top-[202px] flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-0.5">
          <img src={iconVerified} alt="" className="h-4 w-4" />
          <span className="font-gsf text-xs font-medium leading-4 text-[#6B6B6B]">Verified</span>
        </span>
      </div>

      <div className="flex flex-col pt-5">
        <div className="h-[27px] w-[300px] max-w-full">
          <h3 className="truncate font-gsf text-lg font-semibold leading-[27px] text-[#0B0E0D]">
            Rural Chapel Building Fund, Enugu
          </h3>
        </div>
        <p className="font-gsf text-sm leading-5 text-[#667085]">Ends in 10 months</p>
      </div>

      <div className="flex flex-col pt-5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-gsf text-sm leading-5 text-black">Goal</span>
          <span className="font-gsf text-sm leading-5 text-[#667085]">₦756,000/₦10,000,000</span>
        </div>
        <div className="flex h-[25px] items-center gap-3 pt-1">
          <div className="h-2 min-w-0 flex-1 rounded-full bg-[#EBECEC]">
            <div className="h-2 w-[8%] rounded-full bg-[#FE5102]" />
          </div>
          <span className="w-[33px] shrink-0 pl-3 font-gsf text-sm leading-[21px] text-[#344054]">
            8%
          </span>
        </div>
      </div>

      <div className="flex h-[116px] flex-col gap-3 pt-4">
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-center gap-[9px] rounded-md bg-black px-3 py-[10.5px] font-gsf text-xs font-semibold leading-[18px] text-white transition-opacity hover:opacity-90"
        >
          Donate now
        </button>
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-center gap-[9px] rounded-md border border-[#EBEBEB] bg-white px-3 py-[10.5px] font-gsf text-xs font-semibold leading-[18px] text-[#232323] transition-colors hover:bg-[#F8F8F8]"
        >
          Share campaign
        </button>
      </div>
    </article>
  );
}

export function Campaigns() {
  return (
    <section className="mx-auto flex w-full max-w-[1728px] flex-col gap-[124px] px-6 py-24 md:px-[141px] md:py-[156px]">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2.5">
          <h2 className="min-w-0 flex-1 font-gsf text-[clamp(26px,2.08vw,36px)] font-bold leading-[1.1] text-[#232323]">
            featured Campaign
          </h2>
          <Link
            to="/discover"
            className="flex shrink-0 items-center gap-1 transition-opacity hover:opacity-70"
          >
            <span className="font-gsf text-sm font-medium leading-[26.25px] text-[#8C8C8C]">
              View more
            </span>
            <img src={iconChevron} alt="" className="h-[18px] w-[18px]" />
          </Link>
        </div>

        <div className="flex flex-col items-center gap-[23px] md:flex-row md:items-stretch">
          <CampaignCard />
          <CampaignCard />
          <CampaignCard />
        </div>
      </div>
    </section>
  );
}
