import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { AppNav } from "@/components/app/AppNav";
import { cn } from "@/lib/utils";
import { ProgressFill } from "@/components/motion/Reveal";

/* ─── Brand class recipes (see skills/branding/SKILL.md §4) ─── */

export const btnPrimary =
  "press inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink bg-ink px-[22px] py-3 font-gsf text-base font-medium leading-5 tracking-[-0.02em] text-ink-contrast transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

export const btnSecondary =
  "press inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-transparent px-[22px] py-3 font-gsf text-base leading-5 tracking-[-0.02em] text-ink transition-colors hover:bg-ink/5";

export const labelClass = "font-gsf text-sm font-semibold leading-[21px] text-ink";

export const inputClass =
  "w-full rounded-lg border border-line-input bg-paper px-3.5 py-3 font-gsf text-[15px] leading-6 text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink";

export const eyebrowClass =
  "font-gsf text-sm font-semibold uppercase leading-[21px] tracking-[0.1em] text-ink-soft";

export const cardClass = "rounded-xl border border-line-soft bg-paper";

/* ─── Layout ─── */

/**
 * Signed-in app frame: nav + page, no marketing footer (that lives on the website only).
 * `bottomBar` is pinned to the bottom of the screen below `lg` (mobile primary action).
 */
export function AppShell({ children, bottomBar }: { children: ReactNode; bottomBar?: ReactNode }) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col overflow-x-clip bg-paper font-gsf text-heading",
        bottomBar && "pb-[88px] lg:pb-0",
      )}
    >
      <AppNav />
      <main className="flex-1">{children}</main>
      {bottomBar ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-paper px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 lg:hidden">
          {bottomBar}
        </div>
      ) : null}
    </div>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-[1280px] px-6 md:px-12", className)}>{children}</div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lead,
  actions,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-line bg-paper pb-12 pt-12 md:pb-14 md:pt-16">
      <Container className="flex flex-col gap-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex max-w-[820px] flex-col gap-4">
            {eyebrow ? <p className={eyebrowClass}>{eyebrow}</p> : null}
            <h1 className="font-display text-[clamp(32px,3.7vw,56px)] leading-[1.08] tracking-[-0.01em] text-ink">
              {title}
            </h1>
            {lead ? (
              <p className="font-gsf text-lg leading-[27.9px] tracking-[-0.02em] text-ink-soft">
                {lead}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
        </div>
        {children}
      </Container>
    </section>
  );
}

export function SectionHeading({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="font-display text-[clamp(26px,2.3vw,36px)] leading-[1.14] tracking-[-0.01em] text-ink">
        {children}
      </h2>
      {aside}
    </div>
  );
}

/* ─── Controls ─── */

export function Pill({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count?: number;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 font-gsf text-sm font-medium leading-5 transition-colors",
        active
          ? "border-ink bg-ink text-ink-contrast"
          : "border-line bg-paper text-ink-soft hover:border-ink hover:text-ink",
      )}
    >
      {children}
      {count !== undefined ? (
        <span
          className={cn(
            "rounded-full px-1.5 text-xs leading-5",
            active ? "bg-paper/15 text-white" : "bg-panel text-ink-soft",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

export function ChoiceCard({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors",
        selected ? "border-ink bg-panel-olive" : "border-line-soft bg-paper hover:border-ink/40",
      )}
    >
      {icon ? (
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
            selected ? "bg-ink text-ink-contrast" : "bg-panel text-ink-soft",
          )}
        >
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-gsf text-[15px] font-semibold leading-[22px] text-ink">{title}</span>
        {description ? (
          <span className="font-gsf text-sm leading-5 text-muted-ink">{description}</span>
        ) : null}
      </span>
      <span
        className={cn(
          "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
          selected ? "border-ink bg-ink text-ink-contrast" : "border-line-input",
        )}
      >
        {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex w-full items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
            <span
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-full font-gsf text-xs font-semibold",
                done || active
                  ? "bg-ink text-ink-contrast"
                  : "border border-line bg-paper text-muted-ink",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
            </span>
            <span
              className={cn(
                "hidden font-gsf text-[13px] sm:block",
                active ? "font-semibold text-ink" : "text-muted-ink",
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 ? (
              <span className={cn("h-0.5 flex-1", done ? "bg-[#FE5102]" : "bg-line-soft")} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-line-soft">
      <ProgressFill pct={pct} className="h-2" />
    </div>
  );
}

export function StatTile({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-l border-line pl-3 sm:pl-5">
      <span className="whitespace-nowrap font-display text-[clamp(19px,2.3vw,36px)] font-black leading-[1.1] text-ink">
        {value}
      </span>
      <span className="font-gsf text-[13px] leading-[18px] text-ink-soft sm:text-sm sm:leading-5">
        {label}
      </span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-line bg-panel-olive px-8 py-16 text-center">
      {icon ? (
        <span className="grid h-12 w-12 place-items-center rounded-full bg-paper text-ink">
          {icon}
        </span>
      ) : null}
      <p className="font-display text-2xl leading-[1.2] text-ink">{title}</p>
      <p className="max-w-md font-gsf text-base leading-[25.6px] tracking-[-0.02em] text-ink-soft">
        {body}
      </p>
      {action}
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-panel-olive px-4 py-3.5 font-gsf text-sm leading-[21px] text-ink-soft">
      {children}
    </div>
  );
}
