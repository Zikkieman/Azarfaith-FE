import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { formatMoney, type Campaign } from "@/lib/domain";
import {
  everyLabel,
  formatAmountInput,
  parseAmountInput,
  frequenciesFor,
  frequencyLabel,
  presets,
  tipPresets,
  type Frequency,
} from "@/lib/giving";
import { btn } from "@/components/app/btn";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * Give from the page you're reading (after Buy Me a Coffee's support box): pick how often, pick an
 * amount, then go straight to checkout with the choice filled in.
 */
export function GiveBox({ campaign, className }: { campaign: Campaign; className?: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const freqs = frequenciesFor(campaign);
  const [freq, setFreq] = useState<Frequency>(user ? freqs[0] : "once");
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const value = custom ? parseAmountInput(custom) : amount ?? 0;
  const hasAmount = Boolean(custom) || amount !== null;
  const selectedTip = customTip ? parseAmountInput(customTip) : tip;
  const tooSmall = hasAmount && value < 100;

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
                "rounded-field border px-3 py-2.5 text-left font-display text-[17px] leading-tight transition-colors",
                selected
                  ? "border-ink bg-ink text-ink-contrast"
                  : "border-line-input hover:border-ink",
              )}
            >
              {formatMoney(p)}
            </button>
          );
        })}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-ink">Custom amount</span>
        <span className="relative block">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-ink">
            ₦
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={custom}
            onChange={(e) => { setCustom(formatAmountInput(e.target.value)); setAmount(null); }}
            placeholder="Enter an amount"
            className={cn(
              "h-11 w-full rounded-field border bg-paper pl-8 pr-3 font-gsf text-[15px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none",
              custom ? "border-ink" : "border-line-input",
            )}
          />
        </span>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-ink">Donation to AzarFaith (optional)</span>
        <p className="text-[12px] leading-relaxed text-muted-ink">Added to your campaign gift to support verification and platform operations.</p>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="AzarFaith donation amount">
          {tipPresets.map((preset) => {
            const selected = !customTip && tip === preset;
            return (
              <button
                key={preset}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setTip(preset);
                  setCustomTip("");
                }}
                className={cn(
                  "rounded-field border px-3 py-2.5 text-left font-display text-[17px] leading-tight transition-colors",
                  selected
                    ? "border-ink bg-ink text-ink-contrast"
                    : "border-line-input hover:border-ink",
                )}
              >
                {preset ? formatMoney(preset) : "No extra donation"}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-ink">Custom donation</span>
        <span className="relative block">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-ink">
            ₦
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={customTip}
            onChange={(event) => setCustomTip(formatAmountInput(event.target.value))}
            placeholder="Enter custom donation"
            className={cn(
              "h-11 w-full rounded-field border bg-paper pl-8 pr-3 font-gsf text-[15px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none",
              customTip ? "border-ink" : "border-line-input",
            )}
          />
        </span>
      </label>

      <button
        type="button"
        disabled={!hasAmount || tooSmall}
        onClick={() =>
          navigate({
            to: "/donate/$id",
            params: { id: campaign.id },
            search: { freq: freq === "once" ? "" : freq, amount: value, tip: selectedTip || undefined },
          })
        }
        className={cn(btn("primary", "lg"), "w-full")}
      >
        {!hasAmount
          ? "Choose an amount"
          : tooSmall
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
