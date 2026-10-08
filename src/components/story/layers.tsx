import { ReceiptText } from "lucide-react";
import { formatMoney } from "@/lib/mock";
import { cn } from "@/lib/utils";
import { campaign } from "./data";

const layerShell =
  "flex h-full w-full flex-col gap-2 rounded-xl border border-line-soft bg-paper p-4";
const layerTitle = "font-gsf text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-ink";

/** Scene 4 layers, keyed so the animated stage can position each one. */
export function campaignLayers(hoverKey: string | null, setHoverKey: (k: string | null) => void) {
  const pct = Math.round((campaign.raised / campaign.goal) * 100);
  return [
    {
      id: "need",
      node: (
        <div className={cn(layerShell, "p-0 max-md:flex-row max-md:gap-0")}>
          <img
            src={campaign.photo}
            alt=""
            className="h-[55%] w-full rounded-t-xl object-cover max-md:h-full max-md:w-[38%] max-md:rounded-l-xl max-md:rounded-tr-none"
          />
          <div className="flex flex-col gap-1 px-4 pb-3 max-md:justify-center max-md:py-3">
            <p className={layerTitle}>The need</p>
            <p className="font-gsf text-[13px] leading-[18px] text-heading">{campaign.need}</p>
          </div>
        </div>
      ),
    },
    {
      id: "budget",
      node: (
        <div className={layerShell}>
          <p className={layerTitle}>Budget</p>
          {campaign.budget.map((b) => (
            <button
              key={b.key}
              type="button"
              onMouseEnter={() => setHoverKey(b.key)}
              onMouseLeave={() => setHoverKey(null)}
              onFocus={() => setHoverKey(b.key)}
              onBlur={() => setHoverKey(null)}
              className={cn(
                "flex justify-between rounded-md px-2 py-1 text-left font-gsf text-[13px] transition-colors",
                hoverKey === b.key ? "bg-[#FE5102] text-white" : "text-heading hover:bg-panel",
              )}
            >
              <span>{b.label}</span>
              <span>{formatMoney(b.amount)}</span>
            </button>
          ))}
          <p className="mt-auto border-t border-line-soft pt-2 text-right font-gsf text-[13px] font-semibold text-heading">
            {formatMoney(campaign.goal)}
          </p>
        </div>
      ),
    },
    {
      id: "raised",
      node: (
        <div className={cn(layerShell, "justify-center")}>
          <p className={layerTitle}>Raised so far</p>
          <p className="font-display text-[30px] leading-none text-heading">
            {formatMoney(campaign.raised)}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-line-soft">
            <div className="h-2 rounded-full bg-[#FE5102]" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[12px] text-muted-ink">
            {pct}% of {formatMoney(campaign.goal)} · {campaign.givers} givers
          </p>
        </div>
      ),
    },
    {
      id: "receipts",
      node: (
        <div className={layerShell}>
          <p className={layerTitle}>Receipts</p>
          {campaign.receipts.map((r) => (
            <div
              key={r.key}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1 font-gsf text-[13px] transition-colors",
                hoverKey === r.key ? "bg-[#FE5102] text-white" : "text-heading",
              )}
            >
              <ReceiptText className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              <span className="min-w-0 flex-1 truncate">{r.label}</span>
              <span className="shrink-0 text-[12px] opacity-80">
                {r.amount ? formatMoney(r.amount) : r.date}
              </span>
            </div>
          ))}
          <p className="mt-auto text-[11px] text-muted-ink">
            Hover a budget line to find its receipt
          </p>
        </div>
      ),
    },
    {
      id: "updates",
      node: (
        <div className={layerShell}>
          <p className={layerTitle}>Updates</p>
          {campaign.updates.map((u) => (
            <div key={u.date} className="flex gap-3 font-gsf text-[13px]">
              <span className="w-12 shrink-0 text-muted-ink">{u.date}</span>
              <span className="text-heading">{u.text}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "gap",
      node: (
        <div className={cn(layerShell, "justify-center bg-peach")}>
          <p className={layerTitle}>Still needed</p>
          <p className="font-display text-[30px] leading-none text-heading">
            {formatMoney(campaign.goal - campaign.raised)}
          </p>
          <p className="text-[12px] text-ink-soft">For mattresses and delivery</p>
        </div>
      ),
    },
  ];
}
