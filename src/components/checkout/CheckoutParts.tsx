import type { ReactNode } from "react";
import { Check, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/catalog";
import { frequencyLabel, everyLabel, type Frequency } from "@/lib/design-giving";
import { Photo } from "@/components/app/Photo";

export function Step({
  n,
  title,
  optional,
  children,
}: {
  n: number;
  title: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3.5 border-t border-line-soft pt-8 first-of-type:border-0">
      <h2 className="flex items-center gap-3 text-[17px] font-semibold text-ink">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-panel text-[12px] font-semibold text-ink-soft">
          {n}
        </span>
        {title}
        {optional ? <span className="text-sm font-normal text-muted-ink">Optional</span> : null}
      </h2>
      {children}
    </section>
  );
}

export function Option({
  selected,
  onClick,
  row,
  disabled,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  row?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex rounded-field border px-4 py-3 text-left transition-[border-color,box-shadow] duration-200",
        row ? "items-center gap-3" : "flex-col gap-0.5",
        selected
          ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]"
          : "border-line-input hover:border-ink/50",
      )}
    >
      {children}
      <span
        className={cn(
          "absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border transition-colors",
          selected ? "border-ink bg-ink text-ink-contrast" : "border-line-input",
          row && "static ml-auto",
        )}
      >
        {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

export function Summary({
  cover,
  title,
  org,
  verified,
  gift,
  fee,
  tip,
  total,
  freq,
  feePercent,
  mode,
}: {
  cover: string;
  title: string;
  org: string;
  verified: boolean;
  gift: number;
  fee: number;
  tip: number;
  total: number;
  freq: Frequency;
  feePercent: number;
  mode: "AUTO" | "PLEDGE";
}) {
  const recurring = freq !== "once";
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[13px] font-medium text-subtle">Summary</p>
      <div className="flex items-center gap-3">
        <Photo src={cover} className="h-14 w-14 shrink-0 rounded-[12px]" />
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-medium text-ink">{title}</p>
          <p className="flex items-center gap-1 text-[13px] text-muted-ink">
            {org}
            {verified ? <BadgeCheck className="h-3.5 w-3.5 text-verified" strokeWidth={2} /> : null}
          </p>
        </div>
      </div>
      <dl className="flex flex-col gap-2.5 border-t border-line-soft pt-5 text-sm">
        <Row
          label={`Gift${recurring ? `, ${(frequencyLabel[freq] ?? "Recurring").toLowerCase()}` : ""}`}
          value={formatMoney(gift)}
        />
        <Row label={`Platform fee (${feePercent}%)`} value={formatMoney(fee)} />
        {tip ? <Row label="Tip for AzarFaith" value={formatMoney(tip)} /> : null}
      </dl>
      <div className="flex items-baseline justify-between border-t border-line-soft pt-5">
        <span className="text-[15px] font-medium text-ink">{recurring ? "Today" : "Total"}</span>
        <span className="min-w-0 break-words text-right font-display text-[28px] leading-none tracking-[-0.02em] text-ink">
          {formatMoney(total)}
        </span>
      </div>
      {recurring ? (
        <p className="-mt-2 text-[13px] text-muted-ink">
          {mode === "PLEDGE"
            ? "We will remind you to give"
            : `Future charges are ${formatMoney(gift + fee)}`}{" "}
          {everyLabel[freq as Exclude<Frequency, "once">]}. Your next date is confirmed after
          payment. Tips are one-off.
        </p>
      ) : null}
    </div>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-ink">{label}</dt>
      <dd className="min-w-0 break-words text-right tabular-nums text-ink">{value}</dd>
    </div>
  );
}
