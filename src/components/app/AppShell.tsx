import type { ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { BadgeCheck, Check, ChevronLeft } from "lucide-react";
import { AppNav } from "@/components/app/AppNav";
import { Segments } from "@/components/app/Segments";
import { cn } from "@/lib/utils";
import { btn } from "@/components/app/btn";

/*
 * The app kit. Every signed-in page is built from these pieces so buttons, titles, cards and
 * progress look the same everywhere (see skills/branding/SKILL.md §4).
 *
 * Radius scale: rounded-full for buttons, tags and avatars; rounded-card for cards, panels and
 * photos; rounded-field for inputs, options and thumbnails. Nothing else.
 */

/* ─── Class recipes ─── */

export const pageTitleClass =
  "font-display text-[clamp(32px,3.4vw,52px)] leading-[1.06] tracking-[-0.03em] text-ink";
export const flowTitleClass =
  "font-display text-[clamp(28px,2.6vw,40px)] leading-[1.12] tracking-[-0.03em] text-ink";
export const sectionTitleClass =
  "font-display text-[clamp(22px,1.8vw,28px)] leading-[1.2] tracking-[-0.02em] text-ink";
/** Small heading for card titles and list groups. Sentence case, never all caps. */
export const smallHeadingClass = "font-gsf text-[15px] font-semibold leading-[22px] text-ink";

export const labelClass = "font-gsf text-sm font-semibold leading-[21px] text-ink";
export const inputClass =
  "w-full rounded-field border border-line-input bg-paper px-3.5 py-3 font-gsf text-[15px] leading-6 text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink";

export const cardClass = "rounded-card border border-line-soft bg-paper";
export const panelClass = "rounded-card bg-panel";

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

/** Top of every list-style page: title, one line of context, actions on the right. */
export function PageHeader({
  title,
  lead,
  actions,
  children,
}: {
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-line-soft pb-10 pt-10 md:pb-12 md:pt-14">
      <Container className="flex flex-col gap-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex max-w-[760px] flex-col gap-3">
            <h1 className={pageTitleClass}>{title}</h1>
            {lead ? (
              <p className="font-gsf text-lg leading-[1.55] tracking-[-0.02em] text-ink-soft">
                {lead}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>
          ) : null}
        </div>
        {children}
      </Container>
    </section>
  );
}

export function SectionHeading({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className={sectionTitleClass}>{children}</h2>
      {aside}
    </div>
  );
}

/** Title block for a step inside a flow (give, register, create). */
export function FlowTitle({ title, sub }: { title: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className={flowTitleClass}>{title}</h1>
      {sub ? <p className="font-gsf text-base leading-[1.6] text-ink-soft">{sub}</p> : null}
    </div>
  );
}

const backClass =
  "inline-flex w-fit items-center gap-1.5 font-gsf text-sm font-medium text-ink-soft transition-colors hover:text-ink";

/** "Back" or "Back to …" above a page. Pass `to` to link, or `onClick` to step back in a flow. */
export function BackLink({
  children,
  onClick,
  ...link
}: { children: ReactNode; onClick?: () => void } & Partial<LinkProps>) {
  const content = (
    <>
      <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
      {children}
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={backClass}>
        {content}
      </button>
    );
  }
  return (
    <Link {...(link as LinkProps)} className={backClass}>
      {content}
    </Link>
  );
}

/* ─── Controls ─── */

/** Underline tabs: the one way to switch views or filter a list. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "-mx-6 flex gap-6 overflow-x-auto border-b border-line-soft px-6 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 pb-3 font-gsf text-[15px] font-medium transition-colors",
              active ? "border-ink text-ink" : "border-transparent text-muted-ink hover:text-ink",
            )}
          >
            {item.label}
            {item.count !== undefined ? (
              <span className="text-[13px] font-normal text-muted-ink">{item.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** A selectable option in a grid (amounts, tips, categories). */
export function OptionButton({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-field border px-4 py-2.5 font-gsf text-[15px] font-medium transition-colors",
        selected
          ? "border-ink bg-ink text-ink-contrast"
          : "border-line-input bg-paper text-ink hover:border-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** A larger choice with an icon, title and description, selected with a tick. */
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
        "flex w-full items-center gap-4 rounded-card border p-4 text-left transition-colors",
        selected ? "border-ink bg-panel" : "border-line-soft bg-paper hover:border-line-input",
      )}
    >
      {icon ? (
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-field",
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

/** The one stepper for every flow. Labels show from `sm`; phones get "Step 2 of 4: Payment". */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex flex-col gap-3">
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
                    : "border border-line-input bg-paper text-muted-ink",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden whitespace-nowrap font-gsf text-[13px] sm:block",
                  active ? "font-semibold text-ink" : "text-muted-ink",
                )}
              >
                {label}
              </span>
              {i < steps.length - 1 ? (
                <span className={cn("h-0.5 flex-1", done ? "bg-brand" : "bg-line-soft")} />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="font-gsf text-[13px] text-muted-ink sm:hidden">
        Step {current + 1} of {steps.length}:{" "}
        <span className="font-semibold text-ink">{steps[current]}</span>
      </p>
    </div>
  );
}

/** Goal progress (the perforated bar from the campaign cards). */
export function ProgressBar({ pct, className }: { pct: number; className?: string }) {
  return <Segments pct={pct} className={className} />;
}

export function StatTile({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-l border-line-soft pl-3 sm:pl-5">
      <span className="whitespace-nowrap font-display text-[clamp(20px,2.2vw,34px)] leading-[1.1] tracking-[-0.02em] text-ink">
        {value}
      </span>
      <span className="font-gsf text-[13px] leading-[18px] text-muted-ink sm:text-sm sm:leading-5">
        {label}
      </span>
    </div>
  );
}

/* ─── Status ─── */

type Tone = "neutral" | "brand" | "verified" | "attention" | "danger";
const tones: Record<Tone, string> = {
  neutral: "bg-panel text-ink-soft",
  brand: "bg-brand text-white",
  verified: "bg-verified/10 text-verified-ink",
  attention: "bg-brand/10 text-brand-ink",
  danger: "bg-danger/10 text-danger",
};

/** Small status label: Automatic, Unverified, Urgent, Latest. */
export function Tag({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 font-gsf text-xs font-medium leading-5",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/** The green tick that marks a verified organization. */
export function VerifiedBadge({ label = "Verified" }: { label?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1 font-gsf text-[13px] font-medium text-verified-ink">
      <BadgeCheck className="h-4 w-4 text-verified" strokeWidth={2} aria-label="Verified" />
      {label}
    </span>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  return children ? <p className="font-gsf text-[13px] text-danger">{children}</p> : null;
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
    <div className={cn(panelClass, "flex flex-col items-center gap-4 px-8 py-14 text-center")}>
      {icon ? (
        <span className="grid h-12 w-12 place-items-center rounded-full bg-paper text-ink">
          {icon}
        </span>
      ) : null}
      <p className={sectionTitleClass}>{title}</p>
      <p className="max-w-md font-gsf text-base leading-[1.6] text-ink-soft">{body}</p>
      {action}
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-field bg-panel px-4 py-3.5 font-gsf text-sm leading-[21px] text-ink-soft">
      {children}
    </div>
  );
}
