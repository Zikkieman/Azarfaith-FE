import { Link } from "@tanstack/react-router";
import { Photo } from "@/components/app/Photo";
import { toast } from "sonner";
import iconVerified from "@/assets/landing/icon-verified.svg";
import { formatMoney, type Campaign } from "@/lib/mock";
import { ProgressFill } from "@/components/motion/Reveal";

/** Data-driven version of the landing page card (`landing/Campaigns.tsx`). */
export function CampaignCard({ campaign: c }: { campaign: Campaign }) {
  const pct = c.goal ? Math.min(100, Math.round((c.raised / c.goal) * 100)) : 0;

  const share = () => {
    const url = `${window.location.origin}/campaign/${c.id}`;
    navigator.clipboard?.writeText(url);
    toast("Campaign link copied");
  };

  return (
    <article className="flex w-full flex-col rounded-xl border border-line-soft bg-paper p-6 font-gsf">
      <Link
        to="/campaign/$id"
        params={{ id: c.id }}
        className="relative block h-[240px] w-full overflow-hidden rounded-lg"
      >
        <Photo src={c.cover} className="absolute inset-0" />
        <span className="absolute left-3.5 top-3.5 rounded-[25px] bg-[#F8F8F8]/80 px-2 py-1 text-sm leading-5 text-black">
          {c.faithCategory}
        </span>
        {c.verificationStatus === "verified" ? (
          <span className="absolute bottom-3.5 left-2 flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-0.5">
            <img src={iconVerified} alt="" className="h-4 w-4" />
            <span className="text-xs font-medium leading-4 text-[#6B6B6B]">Verified</span>
          </span>
        ) : null}
      </Link>

      <div className="flex flex-col pt-5">
        <Link to="/campaign/$id" params={{ id: c.id }}>
          <h3 className="line-clamp-2 font-gsf text-lg font-semibold leading-[25px] text-heading hover:underline md:line-clamp-1 md:leading-[27px]">
            {c.title}
          </h3>
        </Link>
        <p className="text-sm leading-5 text-muted-ink">
          {c.mode === "ongoing" ? "Ongoing support" : "One-time campaign"} ·{" "}
          {c.donors.toLocaleString()} {c.donors === 1 ? "giver" : "givers"}
        </p>
      </div>

      <div className="flex flex-col pt-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm leading-5 text-heading">{c.goal ? "Goal" : "Raised"}</span>
          <span className="text-sm leading-5 text-muted-ink">
            {c.goal ? `${formatMoney(c.raised)}/${formatMoney(c.goal)}` : formatMoney(c.raised)}
          </span>
        </div>
        {c.goal ? (
          <div className="flex h-[25px] items-center gap-3 pt-1">
            <div className="h-2 min-w-0 flex-1 rounded-full bg-line-soft">
              <ProgressFill pct={pct} className="h-2" />
            </div>
            <span className="shrink-0 text-sm leading-[21px] text-heading">{pct}%</span>
          </div>
        ) : (
          <div className="flex h-[25px] items-center pt-1">
            <span className="text-sm leading-[21px] text-heading">
              {c.frequencies?.length
                ? `Give ${c.frequencies.join(", ")}`
                : "Recurring support welcome"}
            </span>
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-4">
        <Link
          to="/donate/$id"
          params={{ id: c.id }}
          search={{ freq: "" }}
          className="press flex w-full items-center justify-center rounded-md bg-btn px-3 py-[10.5px] text-xs font-semibold leading-[18px] text-btn-fg transition-opacity hover:opacity-90"
        >
          Donate now
        </Link>
        <button
          type="button"
          onClick={share}
          className="press flex w-full items-center justify-center rounded-md border border-line-soft bg-paper px-3 py-[10.5px] text-xs font-semibold leading-[18px] text-heading transition-colors hover:bg-panel"
        >
          Share campaign
        </button>
      </div>
    </article>
  );
}
