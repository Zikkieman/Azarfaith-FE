import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Status views as a segmented control (after Plain's Todo / Snoozed / Done). */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  // On phones the views scroll sideways: keep the chosen one in sight and fade the cut edge.
  const measure = () => {
    const el = ref.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft > 2,
      end: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
    });
  };
  useEffect(() => {
    const el = ref.current;
    const active = el?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (el && active) {
      const left = active.offsetLeft - 8;
      const right = active.offsetLeft + active.offsetWidth + 8;
      if (left < el.scrollLeft) el.scrollLeft = left;
      else if (right > el.scrollLeft + el.clientWidth) el.scrollLeft = right - el.clientWidth;
    }
    measure();
  }, [value]);

  return (
    <div
      ref={ref}
      role="tablist"
      onScroll={measure}
      className="relative inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-[10px] bg-panel p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{
        maskImage:
          edges.start || edges.end
            ? `linear-gradient(to right, ${edges.start ? "transparent, black 28px" : "black"}, ${edges.end ? "black calc(100% - 28px), transparent" : "black"})`
            : undefined,
      }}
    >
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] px-3 font-gsf text-[13px] font-medium transition-all duration-200",
              active
                ? "bg-paper text-ink shadow-[0_1px_2px_rgba(19,14,48,0.1)] ring-1 ring-line-soft"
                : "text-muted-ink hover:text-ink",
            )}
          >
            {it.label}
            {it.count !== undefined ? (
              <span className={cn("tabular-nums", active ? "text-muted-ink" : "text-subtle")}>
                {it.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
