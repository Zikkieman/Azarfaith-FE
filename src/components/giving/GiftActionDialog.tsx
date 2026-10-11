import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { RecurringDonation, SavedPaymentMethod } from "@/lib/catalog";
import { formatCheckoutInput, parseCheckoutInput } from "@/lib/checkout";
import { frequencyLabels, givingDate, money, validateGiftChange } from "@/lib/giving";
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
}: {
  gift: RecurringDonation;
  action: GiftAction;
  methods: SavedPaymentMethod[];
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (values: GiftActionValues) => void;
}) {
  const [amountText, setAmountText] = useState(formatCheckoutInput(String(gift.amount)));
  const [frequency, setFrequency] = useState(gift.frequency);
  const [consent, setConsent] = useState(false);
  const [reason, setReason] = useState("");
  const [authorizationId, setAuthorizationId] = useState(gift.authorizationId ?? "");
  const [validation, setValidation] = useState<string | null>(null);
  const amount = parseCheckoutInput(amountText);
  const title = {
    edit: "Change your recurring gift",
    skip: "Skip the next gift?",
    pause: "Pause your giving?",
    resume: "Resume your giving?",
    cancel: "Stop this recurring gift?",
    card: "Change your saved card",
  }[action];
  function submit() {
    const invalid =
      action === "edit"
        ? validateGiftChange(gift, amount, frequency, consent)
        : action === "card" && (!authorizationId || !consent)
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
      <DialogContent className="max-h-[90dvh] w-[calc(100%-32px)] overflow-y-auto rounded-2xl border-[#e6e3eb] bg-white p-6 text-[#130e30] sm:max-w-[480px]">
        <DialogTitle className="pr-6 text-xl leading-snug">{title}</DialogTitle>
        <DialogDescription className="text-[#777283]">{gift.targetName}</DialogDescription>
        {action === "edit" ? (
          <>
            <label className="giving-label" htmlFor="gift-frequency">
              Frequency
            </label>
            <select
              id="gift-frequency"
              className="giving-input"
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as typeof frequency)}
            >
              {gift.frequencies.map((value) => (
                <option key={value} value={value}>
                  {frequencyLabels[value]}
                </option>
              ))}
            </select>
            <label className="giving-label" htmlFor="gift-amount">
              Gift amount (NGN)
            </label>
            <input
              id="gift-amount"
              className="giving-input"
              inputMode="numeric"
              value={amountText}
              onChange={(event) => setAmountText(formatCheckoutInput(event.target.value))}
              aria-invalid={Boolean(validation)}
            />
            <p className="text-xs leading-relaxed text-[#777283]">
              {frequency === gift.frequency
                ? `An amount change keeps the saved date: ${givingDate(gift.nextDate)}.`
                : "Changing frequency schedules the next gift one new interval from today."}{" "}
              {gift.status === "paused"
                ? "Your gift will remain paused until you resume it."
                : "Past payments are unchanged."}
            </p>
            {gift.mode === "auto" && (
              <label className="flex items-start gap-3 text-sm leading-relaxed">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  className="mt-1 accent-[#e88b00]"
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
            )}
          </>
        ) : action === "card" ? (
          <>
            <label className="giving-label" htmlFor="gift-card">
              Saved card
            </label>
            <select
              id="gift-card"
              className="giving-input"
              value={authorizationId}
              onChange={(event) => setAuthorizationId(event.target.value)}
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
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1 accent-[#e88b00]"
              />
              <span>
                I authorize automatic payments of{" "}
                {money(gift.amount + Math.round((gift.amount * gift.platformFeePercent) / 100))}{" "}
                {frequencyLabels[gift.frequency].toLowerCase()} on this card, including the platform
                fee.
              </span>
            </label>
            <p className="text-xs text-[#777283]">
              Changing the card doesn't resume a paused gift.
            </p>
          </>
        ) : (
          <p className="rounded-xl bg-[#f7f6f9] p-4 text-sm leading-relaxed text-[#615970]">
            {action === "skip"
              ? `We'll skip the scheduled ${givingDate(gift.nextDate)} gift and move to the next future ${frequencyLabels[gift.frequency].toLowerCase()} date. No charge or missed-pledge penalty is added for the skipped date.`
              : action === "pause"
                ? "New charge attempts and pledge reminders will stop. Your schedule is kept for when you're ready to resume."
                : action === "resume"
                  ? "Your gift will resume on the next future date in the saved schedule. We won't collect missed dates as catch-up payments."
                  : "Future payments and reminders will stop permanently. Donations you've already made are unchanged. You can start a new gift any time."}
          </p>
        )}
        {action === "cancel" && (
          <>
            <label htmlFor="cancel-reason" className="giving-label">
              Reason (optional)
            </label>
            <textarea
              id="cancel-reason"
              className="giving-input"
              rows={3}
              maxLength={240}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Anything you'd like to note for your records"
            />
          </>
        )}
        {gift.hasPendingPayment && (
          <p className="text-sm text-amber-800">
            A payment is already processing. This action won't reverse it.
          </p>
        )}
        {(validation || error) && (
          <p role="alert" className="text-sm text-red-700">
            {validation || error}
          </p>
        )}
        <div className="mt-2 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="dashboard-button secondary"
            disabled={busy}
            onClick={onClose}
          >
            Keep as is
          </button>
          <button
            type="button"
            className={`dashboard-button ${action === "cancel" ? "!bg-red-700" : ""}`}
            disabled={busy}
            onClick={submit}
          >
            {busy
              ? "Saving..."
              : action === "edit" || action === "card"
                ? "Save changes"
                : {
                    skip: "Skip next gift",
                    pause: "Pause gift",
                    resume: "Resume gift",
                    cancel: "Stop giving",
                  }[action]}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
