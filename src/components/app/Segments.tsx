import type { CSSProperties } from "react";
import { useInView } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Goal progress drawn as receipt-style perforations that fill one by one on view. The one
 * progress style across the site and app.
 */
export function Segments({
  pct,
  count = 20,
  className,
}: {
  pct: number;
  count?: number;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLDivElement>("0px");
  const on = Math.round((Math.min(100, Math.max(0, pct)) / 100) * count);
  return (
    <div
      ref={ref}
      data-segments=""
      data-shown={inView ? "" : undefined}
      className={cn("flex gap-[3px]", className)}
      role="img"
      aria-label={`${pct}% funded`}
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          data-on={i < on ? "" : undefined}
          style={{ "--i": i } as CSSProperties}
          className={cn("h-2 flex-1 rounded-[2px]", i < on ? "bg-brand" : "bg-line-soft")}
        />
      ))}
    </div>
  );
}
