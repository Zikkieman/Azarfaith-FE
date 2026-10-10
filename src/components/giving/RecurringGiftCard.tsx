import { Link } from "@tanstack/react-router";
import { CreditCard, Heart, Pause, Play, Repeat2, SkipForward } from "lucide-react";
import type { RecurringDonation, SavedPaymentMethod } from "@/lib/catalog";
import { frequencyLabels, givingDate, money } from "@/lib/giving";

export type GiftAction = "edit" | "skip" | "pause" | "resume" | "cancel" | "card";

export function RecurringGiftCard({
  gift,
  methods,
  busy,
  onAction,
}: {
  gift: RecurringDonation;
  methods?: SavedPaymentMethod[];
  busy: boolean;
  onAction: (gift: RecurringDonation, action: GiftAction) => void;
}) {
  const paused = gift.status === "paused";
  const method = methods?.find((item) => item.id === gift.authorizationId);
  const fee = Math.round((gift.amount * gift.platformFeePercent) / 100);
  return (
    <article className="dashboard-panel overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {gift.targetCover ? (
            <img
              src={gift.targetCover}
              alt=""
              className="h-14 w-14 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#fff7ed]">
              <Heart className="text-[#e88b00]" size={22} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <Link
              to="/campaign/$id"
              params={{ id: gift.targetId }}
              className="block text-base font-semibold leading-snug hover:underline"
            >
              {gift.targetName}
            </Link>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-[#777283]">
              <Repeat2 size={13} />{" "}
              {gift.mode === "pledge" ? "Reminder-based pledge" : "Automatic card gift"}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${gift.status === "on_track" ? "bg-emerald-50 text-emerald-800" : paused ? "bg-[#f2f1f5] text-[#615970]" : "bg-amber-50 text-amber-800"}`}
          >
            {gift.status === "on_track"
              ? "Active"
              : gift.status === "paused"
                ? "Paused"
                : "Needs attention"}
          </span>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
          <Fact label="Gift amount" value={money(gift.amount)} />
          <Fact label="Frequency" value={frequencyLabels[gift.frequency]} />
          <Fact
            label={
              paused
                ? "Saved schedule"
                : gift.status === "missed" && gift.mode === "auto"
                  ? "Next retry"
                  : "Next gift"
            }
            value={givingDate(
              gift.status === "missed" && gift.mode === "auto" && gift.nextReminderDate
                ? gift.nextReminderDate
                : gift.nextDate,
            )}
          />
          <Fact
            label={gift.mode === "pledge" ? "Giving since" : "Paid with"}
            value={
              gift.mode === "pledge"
                ? givingDate(gift.createdAt)
                : (method?.label ??
                  (methods ? "No available saved card" : "Card details unavailable"))
            }
          />
        </dl>
        <p className="mt-5 text-xs leading-relaxed text-[#777283]">
          {gift.mode === "pledge"
            ? "We'll remind you to give. You complete each donation yourself."
            : `${money(gift.amount + fee)} per payment, including ${money(fee)} platform fee. No custom tip is repeated automatically.`}
        </p>
        {gift.hasPendingPayment && (
          <p role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            A payment is processing. Schedule and card changes will be available after confirmation.
            Pausing or stopping won't reverse that payment.
          </p>
        )}
        {gift.status === "missed" && (
          <p className="mt-3 text-xs text-amber-800">
            {gift.mode === "auto"
              ? `Payment needs attention (${gift.retryCount} failed attempts). Pause before changing the schedule.`
              : `${gift.missedCount} missed pledges. You can still complete a donation manually.`}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-[#eeedf1] bg-[#fbfafc] px-5 py-4 sm:px-6">
        <button
          type="button"
          className="giving-small-button"
          disabled={busy || gift.hasPendingPayment || gift.status === "missed"}
          onClick={() => onAction(gift, "edit")}
        >
          Change amount / frequency
        </button>
        <button
          type="button"
          className="giving-small-button"
          disabled={busy || gift.hasPendingPayment || paused || gift.status !== "on_track"}
          onClick={() => onAction(gift, "skip")}
        >
          <SkipForward size={14} /> Skip next
        </button>
        <button
          type="button"
          className="giving-small-button"
          disabled={busy || (paused && gift.hasPendingPayment)}
          onClick={() => onAction(gift, paused ? "resume" : "pause")}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
          {paused ? "Resume" : "Pause"}
        </button>
        {gift.mode === "auto" && (
          <button
            type="button"
            className="giving-small-button"
            disabled={
              busy ||
              gift.hasPendingPayment ||
              !methods?.some((method) => method.active && method.reusable)
            }
            onClick={() => onAction(gift, "card")}
          >
            <CreditCard size={14} /> Change card
          </button>
        )}
        {gift.mode === "pledge" && !paused && (
          <Link
            to="/donate/$id"
            params={{ id: gift.targetId }}
            search={{ recurringGiftId: gift.id, amount: String(gift.amount), freq: gift.frequency }}
            className="giving-small-button"
          >
            Give now
          </Link>
        )}
        <button
          type="button"
          className="giving-small-button text-red-700 sm:ml-auto"
          disabled={busy}
          onClick={() => onAction(gift, "cancel")}
        >
          Stop giving
        </button>
      </div>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 text-xs text-[#777283]">{label}</dt>
      <dd className="break-words text-sm font-medium">{value}</dd>
    </div>
  );
}
