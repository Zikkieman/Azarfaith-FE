import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { formatMoney, type Campaign } from "@/lib/mock";

export function CampaignCard({ campaign: c }: { campaign: Campaign }) {
  const pct = c.goal ? Math.min(100, Math.round((c.raised / c.goal) * 100)) : 0;

  return (
    <div className="flex w-full flex-col rounded-xl border border-black/[0.08] bg-white p-6">
      <div className="relative w-full">
        <img src={c.cover} alt="" className="h-[240px] w-full rounded-lg object-cover" />
        <span className="absolute left-3.5 top-3.5 rounded-full bg-[#f8f8f8]/80 px-2 py-1 text-sm capitalize text-black">
          {c.faithCategory}
        </span>
        {c.verificationStatus === "verified" && (
          <span className="absolute bottom-3.5 left-2 flex items-center gap-1 rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-xs font-medium text-[#6b6b6b]">
            <ShieldCheck className="h-4 w-4" /> Verified
          </span>
        )}
      </div>

      <div className="flex flex-col pt-5">
        <h3 className="line-clamp-1 text-lg font-semibold text-[#0b0e0d]">{c.title}</h3>
        <p className="mt-1 text-sm text-[#667085]">Ends in 10 months</p>
      </div>

      <div className="flex flex-col pt-5">
        <div className="flex items-start justify-between text-sm">
          <p className="text-black">Goal</p>
          <p className="font-mono text-[#667085]">
            {formatMoney(c.raised)}/{formatMoney(c.goal ?? 0)}
          </p>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#ebecec]">
            <div className="h-2 rounded-full bg-[#fe5102]" style={{ width: `${pct}%` }} />
          </div>
          <p className="shrink-0 text-sm text-[#344054]">{pct}%</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <Link
          to="/donate/$id"
          params={{ id: c.id }}
          search={{ freq: "" }}
          className="flex w-full items-center justify-center rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-black/90"
        >
          Continue with Email
        </Link>
        <Link
          to="/campaign/$id"
          params={{ id: c.id }}
          className="flex w-full items-center justify-center rounded-lg border border-[#ededed] bg-white px-4 py-3 text-sm font-semibold text-[#232323] hover:bg-muted"
        >
          Continue with Email
        </Link>
      </div>
    </div>
  );
}
