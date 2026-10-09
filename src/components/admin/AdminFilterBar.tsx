import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ListFilter, Search, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{placeholder}</span>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink"
        strokeWidth={1.75}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-[10px] border border-line-soft bg-paper pl-8 pr-8 font-gsf text-sm text-ink transition-colors placeholder:text-subtle focus:border-ink focus:outline-none sm:w-60"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-[6px] text-muted-ink hover:bg-panel hover:text-ink"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      ) : null}
    </label>
  );
}

export type FilterField = {
  key: string;
  label: string;
  icon: LucideIcon;
  options: { value: string; label: string }[];
};
export type { FilterValue } from "@/lib/admin";
import type { FilterValue } from "@/lib/admin";

const menu =
  "rounded-field border border-line-soft bg-paper p-1.5 font-gsf shadow-[0_16px_48px_-16px_rgba(19,14,48,0.25)]";
const item =
  "cursor-pointer rounded-[8px] py-2 pl-8 pr-3 text-sm text-ink focus:bg-panel data-[state=checked]:font-medium";

/** One "Filter" button that opens a menu of fields, each with a checklist (after Plain). */
export function FilterMenu({
  fields,
  value,
  onChange,
}: {
  fields: FilterField[];
  value: FilterValue;
  onChange: (v: FilterValue) => void;
}) {
  const active = Object.values(value).reduce((n, v) => n + v.length, 0);
  const toggle = (key: string, option: string) => {
    const cur = value[key] ?? [];
    onChange({
      ...value,
      [key]: cur.includes(option) ? cur.filter((o) => o !== option) : [...cur, option],
    });
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line-soft bg-paper px-3 font-gsf text-sm text-ink outline-none transition-colors hover:bg-panel focus-visible:ring-2 focus-visible:ring-ink data-[state=open]:bg-panel">
        <ListFilter className="h-4 w-4" strokeWidth={1.75} />
        Filter
        {active ? (
          <span className="rounded-[5px] bg-ink px-1.5 text-[11px] font-semibold text-ink-contrast">
            {active}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn(menu, "w-52")}>
        <DropdownMenuLabel className="px-3 py-1.5 text-[12px] font-medium text-subtle">
          Filter by
        </DropdownMenuLabel>
        {fields.map((f) => (
          <DropdownMenuSub key={f.key}>
            <DropdownMenuSubTrigger className="flex cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm text-ink focus:bg-panel data-[state=open]:bg-panel">
              <f.icon className="h-4 w-4 text-muted-ink" strokeWidth={1.75} />
              <span className="flex-1">{f.label}</span>
              {value[f.key]?.length ? (
                <span className="text-[12px] text-muted-ink">{value[f.key].length}</span>
              ) : null}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className={cn(menu, "w-56")}>
              {f.options.map((o) => (
                <DropdownMenuCheckboxItem
                  key={o.value}
                  checked={value[f.key]?.includes(o.value) ?? false}
                  onCheckedChange={() => toggle(f.key, o.value)}
                  onSelect={(e) => e.preventDefault()}
                  className={item}
                >
                  {o.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Applied filters as removable chips, so it's always clear why rows are missing. */
export function FilterChips({
  fields,
  value,
  onChange,
}: {
  fields: FilterField[];
  value: FilterValue;
  onChange: (v: FilterValue) => void;
}) {
  const applied = fields.filter((f) => value[f.key]?.length);
  if (!applied.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {applied.map((f) => {
        const labels = value[f.key].map((v) => f.options.find((o) => o.value === v)?.label ?? v);
        return (
          <span
            key={f.key}
            className="inline-flex h-7 items-center gap-1.5 rounded-[8px] border border-line-soft bg-panel pl-2.5 pr-1 font-gsf text-[13px] text-ink"
          >
            <f.icon className="h-3.5 w-3.5 text-muted-ink" strokeWidth={1.75} />
            <span className="text-muted-ink">{f.label} is</span>
            <span className="font-medium">{labels.join(", ")}</span>
            <button
              type="button"
              aria-label={`Remove ${f.label} filter`}
              onClick={() => onChange({ ...value, [f.key]: [] })}
              className="grid h-5 w-5 place-items-center rounded-[5px] text-muted-ink hover:bg-paper hover:text-ink"
            >
              <X className="h-3 w-3" strokeWidth={2.25} />
            </button>
          </span>
        );
      })}
      <button
        type="button"
        onClick={() => onChange({})}
        className="h-7 rounded-[8px] px-2 font-gsf text-[13px] text-muted-ink transition-colors hover:bg-panel hover:text-ink"
      >
        Clear all
      </button>
    </div>
  );
}
