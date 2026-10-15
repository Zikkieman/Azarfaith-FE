import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { formatMoney, type Campaign } from "@/lib/domain";
import {
  everyLabel,
  frequenciesFor,
  frequencyLabel,
  hintFor,
  presets,
  type Frequency,
} from "@/lib/giving";
import { btn } from "@/components/app/btn";
import { cn } from "@/lib/utils";

/**
 * Give from the page you're reading (after Buy Me a Coffee's support box): pick how often, pick an
 * amount that says what it buys, then go straight to checkout with everything filled in.
 */
export function GiveBox({ campaign, className }: { campaign: Campaign; className?: string }) {
  const navigate = useNavigate();
  const freqs = frequenciesFor(campaign);
  const [freq, setFreq] = useState<Frequency>(freqs[0]);
  const [amount, setAmount] = useState(presets[1]);
  const [custom, setCustom] = useState("");
  const value = custom ? Number(custom) || 0 : amount;
  const tooSmall = value < 100;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {freqs.length > 1 ? (
        <div
          className="grid grid-flow-col gap-0.5 rounded-[12px] bg-panel p-1"
          role="radiogroup"
          aria-label="How often"
        >
          {freqs.map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={freq === f}
              onClick={() => setFreq(f)}
              className={cn(
                "h-9 rounded-[9px] text-[13px] font-medium transition-all duration-200",
                freq === f
                  ? "bg-paper text-ink shadow-[0_1px_2px_rgba(19,14,48,0.12)] ring-1 ring-line-soft"
                  : "text-muted-ink hover:text-ink",
              )}
            >
              {frequencyLabel[f]}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Amount">
        {presets.map((p) => {
          const selected = !custom && amount === p;
          const hint = hintFor(campaign, p);
          return (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                setAmount(p);
                setCustom("");
              }}
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-field border px-3 py-2.5 text-left transition-colors",
                selected
                  ? "border-ink bg-ink text-ink-contrast"
                  : "border-line-input hover:border-ink",
              )}
            >
              <span className="font-display text-[17px] leading-tight">{formatMoney(p)}</span>
              {hint ? (
                <span
                  className={cn(
                    "line-clamp-2 text-[12px] leading-[1.35]",
                    selected ? "text-ink-contrast/75" : "text-muted-ink",
                  )}
                >
                  {hint}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <label className="relative block">
        <span className="sr-only">Another amount</span>
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-ink">
          ₦
        </span>
        <input
          type="number"
          inputMode="numeric"
          min={100}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Another amount"
          className={cn(
            "h-11 w-full rounded-field border bg-paper pl-8 pr-3 font-gsf text-[15px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none",
            custom ? "border-ink" : "border-line-input",
          )}
        />
      </label>

      <button
        type="button"
        disabled={tooSmall}
        onClick={() =>
          navigate({
            to: "/donate/$id",
            params: { id: campaign.id },
            search: { freq: freq === "once" ? "" : freq, amount: value },
          })
        }
        className={cn(btn("primary", "lg"), "w-full")}
      >
        {tooSmall
          ? "The smallest gift is ₦100"
          : `Give ${formatMoney(value)}${freq === "once" ? "" : ` ${everyLabel[freq]}`}`}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-[12px] text-muted-ink">
        <Lock className="h-3 w-3" strokeWidth={2} /> Paid securely through Paystack. Cancel regular
        gifts any time.
      </p>
    </div>
  );
}
