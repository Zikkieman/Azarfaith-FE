import { ReceiptText } from "lucide-react";
import { formatMoney } from "@/lib/domain";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const layerShell =
  "flex h-full w-full flex-col gap-2 rounded-xl border border-line-soft bg-paper p-4";
const layerTitle = "font-gsf text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-ink";

/** Scene 4 layers, keyed so the animated stage can position each one. */
export function useCampaignLayers(hoverKey: string | null, setHoverKey: (k: string | null) => void) {
  const campaign = useApp(
    (state) => state.campaigns.find((item) => item.verificationStatus === "verified") ?? state.campaigns[0],
  );
  const goal = campaign?.goal ?? 0;
  const raised = campaign?.raised ?? 0;
  const pct = goal ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  const needs = campaign?.needs ?? [];
  const updates = campaign?.updates ?? [];
  return [
    {
      id: "need",
      node: (
        <div className={cn(layerShell, "p-0 max-md:flex-row max-md:gap-0")}>
          {campaign?.cover ? (
            <img
              src={campaign.cover}
              alt=""
              className="h-[55%] w-full rounded-t-xl object-cover max-md:h-full max-md:w-[38%] max-md:rounded-l-xl max-md:rounded-tr-none"
            />
          ) : (
            <div className="h-[55%] w-full rounded-t-xl bg-panel max-md:h-full max-md:w-[38%] max-md:rounded-l-xl max-md:rounded-tr-none" />
          )}
          <div className="flex flex-col gap-1 px-4 pb-3 max-md:justify-center max-md:py-3">
            <p className={layerTitle}>The need</p>
            <p className="font-gsf text-[13px] leading-[18px] text-heading">
              {campaign?.story || "Published campaign details will appear here."}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "budget",
      node: (
        <div className={layerShell}>
          <p className={layerTitle}>What support is needed</p>
          {needs.slice(0, 3).map((need) => (
            <button
              key={need}
              type="button"
              onMouseEnter={() => setHoverKey(need)}
              onMouseLeave={() => setHoverKey(null)}
              onFocus={() => setHoverKey(need)}
              onBlur={() => setHoverKey(null)}
              className={cn(
                "flex justify-between rounded-md px-2 py-1 text-left font-gsf text-[13px] transition-colors",
                hoverKey === need ? "bg-[#FE5102] text-white" : "text-heading hover:bg-panel",
              )}
            >
              <span>{need}</span>
            </button>
          ))}
          {!needs.length ? <p className="text-[12px] text-muted-ink">No itemized needs have been added.</p> : null}
          <p className="mt-auto border-t border-line-soft pt-2 text-right font-gsf text-[13px] font-semibold text-heading">
            {goal ? formatMoney(goal) : "No target set"}
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
            {formatMoney(raised)}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-line-soft">
            <div className="h-2 rounded-full bg-[#FE5102]" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[12px] text-muted-ink">
            {goal ? `${pct}% of ${formatMoney(goal)}` : "Ongoing support"} · {campaign?.donors ?? 0} givers
          </p>
        </div>
      ),
    },
    {
      id: "receipts",
      node: (
        <div className={layerShell}>
          <p className={layerTitle}>Receipts</p>
          <div className="flex items-center gap-2 rounded-md px-2 py-1 font-gsf text-[13px] text-muted-ink">
            <ReceiptText className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            <span>Receipts are published by organizers as funds are used.</span>
          </div>
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
          {updates.slice(0, 2).map((u) => (
            <div key={u.date} className="flex gap-3 font-gsf text-[13px]">
              <span className="w-12 shrink-0 text-muted-ink">{u.date}</span>
              <span className="text-heading">{u.title}</span>
            </div>
          ))}
          {!updates.length ? <p className="text-[12px] text-muted-ink">No campaign updates have been posted yet.</p> : null}
        </div>
      ),
    },
    {
      id: "gap",
      node: (
        <div className={cn(layerShell, "justify-center bg-peach")}>
          <p className={layerTitle}>Still needed</p>
          <p className="font-display text-[30px] leading-none text-heading">
            {goal ? formatMoney(Math.max(goal - raised, 0)) : "Ongoing"}
          </p>
          <p className="text-[12px] text-ink-soft">{goal ? "To reach this campaign's goal" : "Support is available on an ongoing basis"}</p>
        </div>
      ),
    },
  ];
}
