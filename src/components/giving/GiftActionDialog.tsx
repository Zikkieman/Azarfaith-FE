import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/app/DesignDialog";
import type { RecurringDonation, SavedPaymentMethod } from "@/lib/catalog";
import { formatCheckoutInput, parseCheckoutInput } from "@/lib/checkout";
import {
  frequencyLabels,
  givingDate,
  money,
  validateGiftChange,
  giftPresets,
  everyLabel,
} from "@/lib/giving";
import { inputClass, labelClass } from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import { cn } from "@/lib/utils";
import type { GiftAction } from "./RecurringGiftCard";

export type GiftActionValues = {
  amount: number;
  frequency: RecurringDonation["frequency"];
  consent: boolean;
  reason: string;
  authorizationId: string;
};
export function GiftActionDialog({
  gift,
  action,
  methods,
  busy,
  error,
  onClose,
  onConfirm,
  onPauseInstead,
}: {
  gift: RecurringDonation;
  action: GiftAction;
  methods: SavedPaymentMethod[];
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (values: GiftActionValues) => void;
  onPauseInstead?: () => void;
}) {
  const [amountText, setAmountText] = useState(formatCheckoutInput(String(gift.amount)));
  const [frequency, setFrequency] = useState(gift.frequency);
  const [consent, setConsent] = useState(false);
  const [reason, setReason] = useState("");
  const [authorizationId, setAuthorizationId] = useState(gift.authorizationId ?? "");
  const [validation, setValidation] = useState<string | null>(null);
  const amount = parseCheckoutInput(amountText);
  const title = {
    edit: "Change your gift",
    skip: "Skip the next gift?",
    pause: "Pause your giving?",
    resume: "Resume your giving?",
    cancel: "Stop giving to " + gift.targetName + "?",
    card: "Change your saved card",
  }[action];
  function submit() {
    if (busy) return;
    const invalid =
      action === "edit"
        ? validateGiftChange(gift, amount, frequency, consent)
        : action === "card" &&
            (!methods.some(
              (method) => method.id === authorizationId && method.active && method.reusable,
            ) ||
              !consent)
          ? "Choose a saved card and confirm automatic charge consent."
          : null;
    if (invalid) {
      setValidation(invalid);
      return;
    }
    setValidation(null);
    onConfirm({ amount, frequency, consent, reason: reason.trim(), authorizationId });
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[460px] max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {action === "edit"
              ? "The change starts with your next gift. Past payments are unchanged."
              : action === "cancel"
                ? "No more payments or reminders. Gifts you've already made aren't affected, and you can start again any time."
                : gift.targetName}
          </DialogDescription>
        </DialogHeader>
        {action === "edit" ? (
          <>
            <div className="grid grid-cols-3 gap-0.5 rounded-[12px] bg-panel p-1">
              {(["weekly", "monthly", "quarterly"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  disabled={busy || !gift.frequencies.includes(f)}
                  aria-pressed={frequency === f}
                  onClick={() => {
                    setFrequency(f);
                    setConsent(false);
                  }}
                  className={cn(
                    "h-9 rounded-[9px] text-[13px] font-medium transition-all",
                    frequency === f
                      ? "bg-paper text-ink shadow-[0_1px_2px_rgba(19,14,48,0.12)] ring-1 ring-line-soft"
                      : "text-muted-ink hover:text-ink",
                  )}
                >
                  {frequencyLabels[f]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {giftPresets.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={busy || p < gift.minDonation || p > gift.maxDonation}
                  aria-pressed={amount === p}
                  onClick={() => {
                    setAmountText(formatCheckoutInput(String(p)));
                    setConsent(false);
                  }}
                  className={cn(
                    "h-11 rounded-field border text-sm font-medium transition-colors",
                    amount === p
                      ? "border-ink bg-ink text-ink-contrast"
                      : "border-line-input hover:border-ink",
                  )}
                >
                  {money(p)}
                </button>
              ))}
            </div>
            <label className="relative block">
              <span className="sr-only">Another amount</span>
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-ink">
                ₦
              </span>
              <input
                id="gift-amount"
                disabled={busy}
                inputMode="numeric"
                value={amountText}
                onChange={(event) => {
                  setAmountText(formatCheckoutInput(event.target.value));
                  setConsent(false);
                }}
                className={cn(inputClass, "pl-8")}
                aria-invalid={Boolean(validation)}
              />
            </label>
            <p className="text-[13px] text-ink-soft">
              {frequency === gift.frequency
                ? "An amount change keeps your saved date: " + givingDate(gift.nextDate) + "."
                : "Changing frequency schedules the next gift one new interval from today."}{" "}
              {gift.status === "paused"
                ? "Your gift remains paused until you resume it."
                : "Past payments are unchanged."}
            </p>
            {gift.mode === "auto" ? (
              <label className="flex items-start gap-3 text-sm leading-relaxed">
                <input
                  type="checkbox"
                  disabled={busy}
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  className="mt-1 accent-ink"
                />
                <span>
                  I authorize{" "}
                  {Number.isSafeInteger(amount) && amount >= 0
                    ? money(amount + Math.round((amount * gift.platformFeePercent) / 100))
                    : "the gift and platform fee"}{" "}
                  {frequencyLabels[frequency].toLowerCase()} on my saved card, including the
                  platform fee.
                </span>
              </label>
            ) : null}
          </>
        ) : action === "card" ? (
          <>
            <label className={labelClass} htmlFor="gift-card">
              Saved card
            </label>
            <select
              id="gift-card"
              disabled={busy}
              className={inputClass}
              value={authorizationId}
              onChange={(event) => {
                setAuthorizationId(event.target.value);
                setConsent(false);
              }}
            >
              <option value="">Select a card</option>
              {methods
                .filter((method) => method.active && method.reusable)
                .map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label}
                  </option>
                ))}
            </select>
            <label className="flex items-start gap-3 text-sm leading-relaxed">
              <input
                type="checkbox"
                disabled={busy}
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1 accent-ink"
              />
              <span>
                I authorize automatic payments of{" "}
                {money(gift.amount + Math.round((gift.amount * gift.platformFeePercent) / 100))}{" "}
                {frequencyLabels[gift.frequency].toLowerCase()} on this card, including the platform
                fee.
              </span>
            </label>
            <p className="text-[13px] text-ink-soft">
              Changing the card doesn't resume a paused gift.
            </p>
          </>
        ) : (
          <p className="rounded-field bg-panel px-4 py-3 text-sm text-ink-soft">
            {action === "cancel" ? (
              <>
                Not sure? You can <strong className="font-medium text-ink">pause</strong> instead
                and keep everything as it is.
              </>
            ) : action === "skip" ? (
              "Skip the scheduled gift, with no charge or missed-pledge penalty for that date."
            ) : action === "pause" ? (
              "New charges and pledge reminders stop; your schedule is kept."
            ) : (
              "Resume on the next future date in the saved schedule. Missed dates are not charged as catch-up payments."
            )}
          </p>
        )}
        {action === "cancel" ? (
          <label className="flex flex-col gap-2">
            <span className={labelClass}>Reason (optional)</span>
            <textarea
              id="cancel-reason"
              disabled={busy}
              className={inputClass}
              rows={3}
              maxLength={240}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Anything you'd like to note for your records"
            />
          </label>
        ) : null}
        {gift.hasPendingPayment ? (
          <p className="text-[13px] text-brand-ink">
            A payment is already processing. This action won't reverse it.
          </p>
        ) : null}
        {validation || error ? (
          <p role="alert" className="text-[13px] text-danger">
            {validation || error}
          </p>
        ) : null}
        <DialogFooter>
          <button
            type="button"
            className={btn("secondary")}
            disabled={busy}
            onClick={action === "cancel" && onPauseInstead ? onPauseInstead : onClose}
          >
            {action === "cancel"
              ? gift.status === "paused"
                ? "Keep paused"
                : "Pause instead"
              : "Cancel"}
          </button>
          <button
            type="button"
            className={btn(action === "cancel" ? "danger" : "primary")}
            disabled={
              busy || (action === "edit" && gift.amount === amount && gift.frequency === frequency)
            }
            onClick={submit}
          >
            {busy
              ? "Saving..."
              : action === "edit"
                ? Number.isSafeInteger(amount) && amount > 0
                  ? "Save " + money(amount) + " " + everyLabel[frequency]
                  : "Save gift"
                : action === "card"
                  ? "Save changes"
                  : action === "cancel"
                    ? "Stop giving"
                    : action === "pause"
                      ? "Pause gift"
                      : action === "resume"
                        ? "Resume gift"
                        : "Skip next gift"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
