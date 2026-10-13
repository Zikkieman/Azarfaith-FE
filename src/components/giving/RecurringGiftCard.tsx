import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CreditCard, HandHeart, Pause, Play, SkipForward, Wallet } from "lucide-react";
import type { RecurringDonation, SavedPaymentMethod } from "@/lib/catalog";
import { formatMoney } from "@/lib/catalog";
import { frequencyLabels, everyLabel, givingDate } from "@/lib/giving";
import { Tag } from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import { cn } from "@/lib/utils";
/** One regular gift, managed like a subscription: the facts, then what you can do with it. */
export type GiftAction = "edit" | "skip" | "pause" | "resume" | "cancel" | "card";
export function RecurringGiftCard({
  gift: g,
  methods,
  busy,
  onAction,
}: {
  gift: RecurringDonation;
  methods?: SavedPaymentMethod[];
  busy: boolean;
  onAction: (gift: RecurringDonation, action: GiftAction) => void;
}) {
  const paused = g.status === "paused";
  const method = methods?.find((card) => card.id === g.authorizationId);
  const fee = Math.round((g.amount * g.platformFeePercent) / 100);
  const skip = () => onAction(g, "skip");
  const togglePause = () => onAction(g, paused ? "resume" : "pause");
  const facts = [
    { label: "Amount", value: formatMoney(g.amount) },
    { label: "How often", value: frequencyLabels[g.frequency] },
    {
      label: g.status === "missed" && g.mode === "auto" ? "Next retry" : "Next gift",
      value: paused
        ? "Paused"
        : g.status === "missed" && g.mode === "auto"
          ? g.nextReminderDate
            ? givingDate(g.nextReminderDate)
            : "Needs attention"
          : givingDate(g.nextDate),
    },
    {
      label: "Paid with",
      value:
        g.mode === "pledge"
          ? "Reminder, you pay"
          : (method?.label ?? (methods ? "No available saved card" : "Card details unavailable")),
    },
    { label: "Since", value: givingDate(g.createdAt) },
  ];

  const status =
    g.status === "missed" ? (
      <Tag tone="attention">Needs attention</Tag>
    ) : paused ? (
      <Tag>Paused</Tag>
    ) : g.mode === "pledge" ? (
      <Tag tone="attention">Reminder</Tag>
    ) : (
      <Tag tone="verified">Automatic</Tag>
    );

  return (
    <article className="overflow-hidden rounded-card border border-line-soft">
      <div className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
        <GiftPhoto src={g.targetCover} className="h-12 w-12 shrink-0 rounded-field object-cover" />
        <div className="min-w-0 flex-1">
          <Link
            to="/campaign/$id"
            params={{ id: g.targetId }}
            className="line-clamp-2 text-[16px] font-semibold leading-snug text-ink hover:underline"
          >
            {g.targetName}
          </Link>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-ink">
            {formatMoney(g.amount)} {everyLabel[g.frequency]}
            <span className="sm:hidden">{status}</span>
          </p>
        </div>
        <span className="hidden sm:block">{status}</span>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line-soft px-5 py-4 sm:grid-cols-3 lg:grid-cols-5">
        {facts.map((f) => (
          <div key={f.label} className="min-w-0">
            <dt className="text-[12px] text-muted-ink">{f.label}</dt>
            <dd
              className={cn("truncate text-sm text-ink", f.value === "Paused" && "text-muted-ink")}
            >
              {f.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="px-5 pb-4 text-[12px] leading-relaxed text-muted-ink">
        {g.mode === "pledge"
          ? "We remind you to give. You complete each donation yourself."
          : formatMoney(g.amount + fee) +
            " per payment, including " +
            formatMoney(fee) +
            " platform fee. Custom tips are not repeated."}
      </p>
      {g.hasPendingPayment ? (
        <p role="status" className="px-5 pb-4 text-[13px] text-brand-ink">
          A payment is processing. Schedule and card changes are unavailable until confirmation.
          Pausing or stopping won't reverse it.
        </p>
      ) : null}
      {g.status === "missed" ? (
        <p className="px-5 pb-4 text-[13px] text-brand-ink">
          {g.mode === "auto"
            ? "Payment needs attention. Pause before changing the schedule."
            : "A pledge was missed. You can still give manually."}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 border-t border-line-soft bg-panel/50 px-5 py-3">
        <button
          type="button"
          className={btn("secondary", "sm")}
          disabled={busy || g.hasPendingPayment || g.status === "missed"}
          onClick={() => onAction(g, "edit")}
        >
          <Wallet className="h-3.5 w-3.5" strokeWidth={1.75} /> Change amount
        </button>
        <button
          type="button"
          className={btn("secondary", "sm")}
          onClick={skip}
          disabled={busy || g.hasPendingPayment || paused || g.status !== "on_track"}
        >
          <SkipForward className="h-3.5 w-3.5" strokeWidth={1.75} /> Skip next
        </button>
        <button
          type="button"
          className={btn("secondary", "sm")}
          disabled={busy || (paused && g.hasPendingPayment)}
          onClick={togglePause}
        >
          {paused ? (
            <>
              <Play className="h-3.5 w-3.5" strokeWidth={1.75} /> Resume
            </>
          ) : (
            <>
              <Pause className="h-3.5 w-3.5" strokeWidth={1.75} /> Pause
            </>
          )}
        </button>
        {g.mode === "auto" ? (
          <button
            type="button"
            className={btn("secondary", "sm")}
            disabled={
              busy ||
              g.hasPendingPayment ||
              !methods?.some((method) => method.active && method.reusable)
            }
            onClick={() => onAction(g, "card")}
          >
            <CreditCard className="h-3.5 w-3.5" strokeWidth={1.75} /> Change card
          </button>
        ) : !paused ? (
          <Link
            to="/donate/$id"
            params={{ id: g.targetId }}
            search={{ recurringGiftId: g.id, amount: String(g.amount), freq: g.frequency }}
            className={btn("secondary", "sm")}
          >
            Give now
          </Link>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction(g, "cancel")}
          className="ml-auto text-sm font-medium text-danger hover:underline"
        >
          Stop giving
        </button>
      </div>
    </article>
  );
}

export function GiftPhoto({ src, className }: { src?: string; className: string }) {
  const [failedSrc, setFailedSrc] = useState<string>();
  return src && failedSrc !== src ? (
    <img src={src} alt="" className={className} onError={() => setFailedSrc(src)} />
  ) : (
    <span
      aria-hidden="true"
      className={cn(className, "grid place-items-center bg-panel text-ink-soft")}
    >
      <HandHeart className="h-5 w-5" strokeWidth={1.5} />
    </span>
  );
}
