import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, LockKeyhole } from "lucide-react";
import { formatAmountInput, formatMoney, parseAmountInput, type Campaign } from "@/lib/catalog";
import { givingFrequencies, isPublished, progressPercent } from "@/lib/discovery";

export function GiveBox({
  campaign,
  authenticated,
}: {
  campaign: Campaign;
  authenticated: boolean;
}) {
  const [amount, setAmount] = useState("5,000");
  const [frequency, setFrequency] = useState("once");
  const frequencies = givingFrequencies(campaign);
  const selected = frequencies.includes(frequency as (typeof frequencies)[number])
    ? frequency
    : "once";
  const value = parseAmountInput(amount);
  const valid = Number.isSafeInteger(value) && value >= 100;
  const published = isPublished(campaign);
  const percent = progressPercent(campaign.raised, campaign.goal);
  return (
    <section
      id={`give-${campaign.id}`}
      className="public-panel scroll-mt-24 p-6"
      aria-label="Give to this campaign"
    >
      <h2 className="text-xl font-semibold">Make a difference</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {campaign.mode === "ongoing"
          ? "Give once or support this work regularly."
          : "Every gift brings this cause closer to its goal."}
      </p>
      <div className="mt-6 flex items-baseline justify-between gap-2">
        <strong className="text-2xl">{formatMoney(campaign.raised)}</strong>
        <span className="text-xs text-muted-foreground">{campaign.donors} supporters</span>
      </div>
      {percent !== null && (
        <>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-orange-400" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {percent}% of {formatMoney(campaign.goal ?? 0)} goal
          </p>
        </>
      )}
      {frequencies.length > 1 && (
        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium" htmlFor={`frequency-${campaign.id}`}>
            Giving frequency
          </label>
          <select
            id={`frequency-${campaign.id}`}
            className="public-input"
            value={selected}
            onChange={(event) => setFrequency(event.target.value)}
          >
            {frequencies.map((freq) => (
              <option key={freq} value={freq}>
                {freq === "once"
                  ? "One-time gift"
                  : `${freq.charAt(0).toUpperCase()}${freq.slice(1)}`}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="mt-5 grid grid-cols-3 gap-2">
        {[2000, 5000, 10000].map((preset) => (
          <button
            key={preset}
            className={`rounded-xl border px-2 py-3 text-sm ${value === preset ? "border-orange-400 bg-orange-50" : "border-stone-200"}`}
            onClick={() => setAmount(formatAmountInput(String(preset)))}
          >
            {formatMoney(preset)}
          </button>
        ))}
      </div>
      <label className="mt-5 block text-sm font-medium" htmlFor={`amount-${campaign.id}`}>
        Your amount (NGN)
      </label>
      <input
        id={`amount-${campaign.id}`}
        className="public-input mt-2"
        inputMode="numeric"
        value={amount}
        onChange={(event) => setAmount(formatAmountInput(event.target.value))}
        aria-invalid={!valid}
      />
      {!valid && <p className="mt-2 text-xs text-red-600">Enter an amount of at least ₦100.</p>}
      {!published ? (
        <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Donations will open when this campaign and its organization have been approved.
        </p>
      ) : !authenticated && selected !== "once" ? (
        <>
          <p className="mt-4 text-xs text-muted-foreground">
            Sign in to manage recurring support. You can give once without an account.
          </p>
          <Link to="/login" className="public-button mt-4 w-full justify-center">
            Sign in for recurring giving
          </Link>
        </>
      ) : valid ? (
        <Link
          to="/donate/$id"
          params={{ id: campaign.id }}
          search={{ freq: selected, amount: String(value) }}
          className="public-button mt-5 w-full justify-center"
        >
          <Heart className="h-4 w-4" /> Donate now
        </Link>
      ) : (
        <button disabled className="public-button mt-5 w-full justify-center opacity-50">
          Donate now
        </button>
      )}
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <LockKeyhole className="h-3 w-3" /> Secure checkout with Paystack
      </p>
    </section>
  );
}
