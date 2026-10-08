import type { ElementType, ReactNode } from "react";
import { useCountUp, useInView } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Rises into place the first time it scrolls into view. Children with `data-stagger`
 * follow one after another. Hidden only when JS is running and motion is allowed.
 */
export function Reveal({
  as: Tag = "div",
  className,
  children,
  delay = 0,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  delay?: number;
}) {
  const [ref, inView] = useInView<HTMLElement>();
  return (
    <Tag
      ref={ref}
      data-reveal=""
      data-shown={inView ? "" : undefined}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={className}
    >
      {children}
    </Tag>
  );
}

/** Counts "₦250M+" / "18k+" / "480+" up from zero when it scrolls into view. */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const m = value.match(/^(\D*)([\d.,]+)([kKM]?)(.*)$/);
  const [ref, inView] = useInView<HTMLSpanElement>();
  const target = m ? parseFloat(m[2].replace(/,/g, "")) : 0;
  const n = useCountUp(target, inView);
  if (!m) return <span className={className}>{value}</span>;
  const [, prefix, , unit, suffix] = m;
  return (
    <span ref={ref} className={cn("tabular-nums", className)} aria-label={value}>
      <span aria-hidden>
        {prefix}
        {n.toLocaleString()}
        {unit}
        {suffix}
      </span>
    </span>
  );
}

/** Progress fill that grows from empty the first time it scrolls into view. */
export function ProgressFill({ pct, className }: { pct: number; className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>("0px");
  return (
    <div
      ref={ref}
      data-fill=""
      data-shown={inView ? "" : undefined}
      className={cn("fill-in rounded-full bg-[#FE5102]", className)}
      style={{ width: `${pct}%` }}
    />
  );
}
