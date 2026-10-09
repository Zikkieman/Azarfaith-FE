import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  /** Makes the column sortable by this value. */
  sortValue?: (row: T) => number | string;
  /** Extra classes on both header and cells, e.g. `hidden md:table-cell`. */
  className?: string;
};

type Sort = { key: string; dir: "asc" | "desc" } | null;

/**
 * The admin data table: sortable headers, whole-row click, a row menu, staggered rows and
 * "Showing 1–8 of 12" pagination. Wraps in a white card and scrolls sideways on phones.
 */
export function AdminTable<T extends { id: string }>({
  rows,
  columns,
  label,
  onRowClick,
  rowMenu,
  empty,
  perPage = 8,
  minWidth = 760,
}: {
  rows: T[];
  columns: Column<T>[];
  label: string;
  onRowClick?: (row: T) => void;
  rowMenu?: (row: T) => RowAction[];
  empty: ReactNode;
  perPage?: number;
  minWidth?: number;
}) {
  const [sort, setSort] = useState<Sort>(null);
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [rows.length]);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const get = col.sortValue;
    return [...rows].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      const r =
        typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return sort.dir === "asc" ? r : -r;
    });
  }, [rows, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / perPage));
  const current = Math.min(page, pages);
  const shown = sorted.slice((current - 1) * perPage, current * perPage);
  const from = sorted.length ? (current - 1) * perPage + 1 : 0;
  const to = Math.min(current * perPage, sorted.length);

  const toggleSort = (key: string) =>
    setSort((s) =>
      !s || s.key !== key ? { key, dir: "desc" } : s.dir === "desc" ? { key, dir: "asc" } : null,
    );

  return (
    <div className="overflow-hidden rounded-card border border-line-soft bg-paper">
      {rows.length === 0 ? (
        <div className="px-6 py-16">{empty}</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-gsf text-sm" style={{ minWidth }}>
              <caption className="sr-only">{label}</caption>
              <thead>
                <tr className="border-b border-line-soft bg-panel/50">
                  {columns.map((c) => {
                    const active = sort?.key === c.key;
                    return (
                      <th
                        key={c.key}
                        scope="col"
                        aria-sort={
                          active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined
                        }
                        className={cn(
                          "h-11 whitespace-nowrap px-4 text-[13px] font-medium text-muted-ink first:pl-5",
                          c.align === "right" && "text-right",
                          c.className,
                        )}
                      >
                        {c.sortValue ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(c.key)}
                            className={cn(
                              "inline-flex items-center gap-1 transition-colors hover:text-ink",
                              active && "text-ink",
                            )}
                          >
                            {c.header}
                            {active ? (
                              sort!.dir === "asc" ? (
                                <ArrowUp className="h-3.5 w-3.5" strokeWidth={2} />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} />
                              )
                            ) : (
                              <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" strokeWidth={2} />
                            )}
                          </button>
                        ) : (
                          c.header
                        )}
                      </th>
                    );
                  })}
                  {rowMenu ? (
                    <th scope="col" className="w-14 pr-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {shown.map((row, i) => (
                  <tr
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === "Enter") onRowClick(row);
                          }
                        : undefined
                    }
                    tabIndex={onRowClick ? 0 : undefined}
                    className={cn(
                      "admin-row border-b border-line-soft transition-colors last:border-0",
                      onRowClick &&
                        "cursor-pointer hover:bg-panel/60 focus-visible:bg-panel/60 focus-visible:outline-none",
                    )}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          "h-16 px-4 align-middle first:pl-5",
                          c.align === "right" && "text-right tabular-nums",
                          c.className,
                        )}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                    {rowMenu ? (
                      <td className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <RowMenu actions={rowMenu(row)} />
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-line-soft px-5 py-3 text-[13px] text-muted-ink">
            <span>
              Showing <span className="font-medium text-ink">{from}</span>–
              <span className="font-medium text-ink">{to}</span> of{" "}
              <span className="font-medium text-ink">{sorted.length}</span>
            </span>
            {pages > 1 ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline">
                  Page {current} of {pages}
                </span>
                <PageButton
                  label="Previous page"
                  icon={ChevronLeft}
                  disabled={current === 1}
                  onClick={() => setPage(current - 1)}
                />
                <PageButton
                  label="Next page"
                  icon={ChevronRight}
                  disabled={current === pages}
                  onClick={() => setPage(current + 1)}
                />
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function PageButton({
  label,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-full border border-line-input text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line-input"
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}

export type RowAction = {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  tone?: "danger";
};

/** The "…" menu at the end of a row. Labels, not mystery icons. */
export function RowMenu({ actions }: { actions: RowAction[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Row actions"
        className="grid h-8 w-8 place-items-center rounded-full text-muted-ink outline-none transition-colors hover:bg-panel hover:text-ink focus-visible:ring-2 focus-visible:ring-ink data-[state=open]:bg-panel data-[state=open]:text-ink"
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 rounded-field border border-line-soft bg-paper p-1.5 font-gsf shadow-[0_16px_48px_-16px_rgba(19,14,48,0.25)]"
      >
        {actions.map((a) => (
          <DropdownMenuItem
            key={a.label}
            onSelect={a.onSelect}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-sm focus:bg-panel",
              a.tone === "danger" ? "text-danger focus:text-danger" : "text-ink",
            )}
          >
            <a.icon className="h-4 w-4" strokeWidth={1.75} /> {a.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
