import { useId, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { formatMoney, type Campaign } from "@/lib/catalog";
import {
  everyLabel,
  frequenciesFor,
  frequencyLabel,
  hintFor,
  presets,
  type Frequency,
} from "@/lib/design-giving";
import { btn } from "@/components/app/btn";
import { useQuery } from "@tanstack/react-query";
import { getCheckoutContext } from "@/features/catalog/api";
import { useAppSelector } from "@/app/hooks";
import { isPublished } from "@/lib/discovery";
import { parseCheckoutInput } from "@/lib/checkout";
import { cn } from "@/lib/utils";

/**
 * Give from the page you're reading (after Buy Me a Coffee's support box): pick how often, pick an
 * amount that says what it buys, then go straight to checkout with everything filled in.
 */
export function GiveBox({ campaign, className }: { campaign: Campaign; className?: string }) {
  const navigate = useNavigate();
  const { user, hydrated } = useAppSelector((s) => s.auth);
  const inputId = useId();
  const published = isPublished(campaign);
  const checkout = useQuery({
    queryKey: ["checkout", campaign.id, user?.id ?? "guest", ""],
    queryFn: () => getCheckoutContext(campaign.id),
    enabled: hydrated && published,
    refetchInterval: 30000,
    retry: false,
  });
  const allowed = checkout.data?.frequencies.map((f) => f.toLowerCase()) ?? [];
  const freqs = frequenciesFor(campaign).filter((f) => f === "once" || allowed.includes(f));
  const [freq, setFreq] = useState<Frequency>(frequenciesFor(campaign)[0]);
  const [amount, setAmount] = useState(presets[1]);
  const [custom, setCustom] = useState("");
  const selectedFreq = freqs.includes(freq) ? freq : freqs[0];
  const value = custom ? parseCheckoutInput(custom) : amount;
  const minimum = checkout.data?.minDonation ?? 100;
  const maximum = checkout.data?.maxDonation ?? Number.MAX_SAFE_INTEGER;
  const tooSmall = !Number.isSafeInteger(value) || value < minimum || value > maximum;
  const disabled = tooSmall || !published || !checkout.data || Boolean(checkout.data.givingPaused);
  const choose = () => {
    if (disabled) return;
    const returnTo =
      "/donate/" +
      encodeURIComponent(campaign.id) +
      "?" +
      new URLSearchParams({ freq: selectedFreq, amount: String(value) });
    if (!user && selectedFreq !== "once") void navigate({ to: "/login", search: { returnTo } });
    else
      void navigate({
        to: "/donate/$id",
        params: { id: campaign.id },
        search: { freq: selectedFreq, amount: String(value) },
      });
  };

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
              aria-checked={selectedFreq === f}
              onClick={() => setFreq(f)}
              className={cn(
                "h-9 rounded-[9px] text-[13px] font-medium transition-all duration-200",
                selectedFreq === f
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
              disabled={p < minimum || p > maximum}
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
                  title="Illustrative suggestion. Actual uses of funds are described in the campaign story."
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
          id={inputId}
          min={minimum}
          max={maximum}
          step={1}
          aria-invalid={Boolean(custom) && tooSmall}
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
        disabled={disabled}
        onClick={choose}
        className={cn(btn("primary", "lg"), "w-full")}
      >
        {!published
          ? "Giving opens after approval"
          : checkout.data?.givingPaused
            ? "Giving is temporarily paused"
            : tooSmall
              ? "Enter a valid gift amount"
              : `Give ${formatMoney(value)}${selectedFreq === "once" ? "" : ` ${everyLabel[selectedFreq]}`}`}
      </button>
      {checkout.isError && (
        <p role="alert" className="text-sm text-muted-ink">
          Giving options could not load.{" "}
          <button type="button" className="underline" onClick={() => void checkout.refetch()}>
            Retry
          </button>
        </p>
      )}
      {custom && tooSmall && (
        <p role="alert" className="text-sm text-red-700">
          Enter a whole-naira amount between {formatMoney(minimum)} and {formatMoney(maximum)}.
        </p>
      )}
      {!user && selectedFreq !== "once" && (
        <p className="text-[13px] text-muted-ink">
          Sign in to manage recurring giving. One-time gifts do not need an account.
        </p>
      )}
      <p className="flex items-center justify-center gap-1.5 text-[12px] text-muted-ink">
        <Lock className="h-3 w-3" strokeWidth={2} /> Paid securely through Paystack. Cancel regular
        gifts any time.
      </p>
    </div>
  );
}
