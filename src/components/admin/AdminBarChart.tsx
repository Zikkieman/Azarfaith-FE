import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Single-series column chart: one ink colour, 4px rounded tops on a shared baseline, a hover
 * value on every column and the peak labelled directly. A visually hidden table carries the data
 * for screen readers.
 */
export function AdminColumnChart({
  data,
  format = (v) => v.toLocaleString(),
  label,
  className,
}: {
  data: { label: string; value: number }[];
  format?: (v: number) => string;
  label: string;
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const peak = data.findIndex((d) => d.value === max);

  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      <div
        aria-hidden
        className="flex h-60 items-end gap-2 border-b border-line-soft pt-8 sm:gap-3"
      >
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div key={d.label} className="group relative flex h-full flex-1 flex-col justify-end">
              <span
                className={cn(
                  "pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[8px] px-2 py-1 text-[12px] font-medium transition-opacity duration-200",
                  i === peak
                    ? "text-ink-soft opacity-100 group-hover:bg-ink group-hover:text-ink-contrast"
                    : "bg-ink text-ink-contrast opacity-0 group-hover:opacity-100",
                )}
                style={{ bottom: `calc(${pct}% + 6px)` }}
              >
                {format(d.value)}
              </span>
              <span
                className="bar-rise mx-auto block w-full max-w-[48px] rounded-t-[4px] bg-ink transition-opacity duration-200 group-hover:opacity-80"
                style={{ height: `${pct}%`, animationDelay: `${i * 45}ms` } as CSSProperties}
              />
            </div>
          );
        })}
      </div>
      <div aria-hidden className="flex gap-2 sm:gap-3">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-[12px] text-muted-ink">
            {d.label}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
