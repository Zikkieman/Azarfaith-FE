import type { ReactNode } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const field =
  "h-10 rounded-field border border-line-soft bg-paper font-gsf text-sm text-ink transition-colors focus:border-ink focus:outline-none";

/** Search plus any dropdown filters, in one row above a table. */
export function AdminToolbar({
  search,
  onSearch,
  placeholder,
  children,
  onClear,
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder: string;
  children?: ReactNode;
  onClear?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className="relative flex-1 sm:max-w-[360px]">
        <span className="sr-only">{placeholder}</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink"
          strokeWidth={1.75}
        />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className={cn(field, "w-full pl-9 pr-3 placeholder:text-subtle")}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        {children}
        {onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-paper hover:text-ink"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} /> Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function AdminSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(field, "cursor-pointer appearance-none pl-3 pr-9")}
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink"
        strokeWidth={2}
      />
    </label>
  );
}
