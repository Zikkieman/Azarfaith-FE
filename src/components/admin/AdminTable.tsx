import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  sortValue?: (row: T) => number | string;
  /** Extra classes on header and cells, e.g. `hidden lg:table-cell` or a width. */
  className?: string;
};

export type BulkAction = {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  tone?: "danger";
  /** When set, the action shows but can't be used, and says why. */
  disabledReason?: string;
};

type Sort = { key: string; dir: "asc" | "desc" } | null;

/**
 * Flat data table (after TheyDo and Plain): checkboxes with a floating bulk bar, sortable headers,
 * whole-row click with the open row highlighted, an inline action slot, rows-per-page and range
 * pagination. Phones get `mobileRow` cards instead of a sideways-scrolling table.
 */
export function AdminTable<T extends { id: string }>({
  rows,
  columns,
  label,
  noun,
  onRowClick,
  activeId,
  rowAction,
  bulkActions,
  mobileRow,
  empty,
  initialSort = null,
}: {
  rows: T[];
  columns: Column<T>[];
  label: string;
  /** Singular and plural, for "2 organizations selected". */
  noun: [string, string];
  onRowClick?: (row: T) => void;
  activeId?: string | null;
  rowAction?: (row: T) => ReactNode;
  bulkActions?: (selected: T[]) => BulkAction[];
  mobileRow?: (row: T) => ReactNode;
  empty: ReactNode;
  initialSort?: Sort;
}) {
  const [sort, setSort] = useState<Sort>(initialSort);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // New filter or search: back to page one, and forget selections that left the list.
  const ids = rows.map((r) => r.id).join(",");
  useEffect(() => {
    setPage(1);
    setSelected((s) => new Set([...s].filter((id) => rows.some((r) => r.id === id))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key);
    if (!sort || !col?.sortValue) return rows;
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

  const selectable = Boolean(bulkActions);
  const pageIds = shown.map((r) => r.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPage = pageIds.some((id) => selected.has(id));
  const headerBox = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerBox.current) headerBox.current.indeterminate = someOnPage && !allOnPage;
  }, [someOnPage, allOnPage]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const togglePage = () =>
    setSelected((s) => {
      const n = new Set(s);
      if (allOnPage) pageIds.forEach((id) => n.delete(id));
      else pageIds.forEach((id) => n.add(id));
      return n;
    });

  const toggleSort = (key: string) =>
    setSort((s) =>
      !s || s.key !== key ? { key, dir: "desc" } : s.dir === "desc" ? { key, dir: "asc" } : null,
    );

  const selectedRows = rows.filter((r) => selected.has(r.id));

  if (rows.length === 0) {
    return (
      <div className="rounded-field border border-dashed border-line-input px-6 py-16">{empty}</div>
    );
  }

  return (
    <div className="flex flex-col">
      {mobileRow ? (
        <ul className="flex flex-col divide-y divide-line-soft border-y border-line-soft sm:hidden">
          {shown.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className="w-full py-3.5 text-left"
              >
                {mobileRow(row)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className={cn("overflow-x-auto", mobileRow && "hidden sm:block")}>
        <table className="w-full min-w-[720px] border-collapse text-left font-gsf text-sm">
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr className="border-b border-line-soft">
              {selectable ? (
                <th scope="col" className="w-10 pb-2.5 pl-1 pr-2 align-bottom">
                  <input
                    ref={headerBox}
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={allOnPage}
                    onChange={togglePage}
                    className="h-4 w-4 cursor-pointer accent-ink"
                  />
                </th>
              ) : null}
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
                      "whitespace-nowrap px-3 pb-2.5 align-bottom text-[13px] font-medium text-muted-ink",
                      c.align === "right" && "text-right",
                      c.className,
                    )}
                  >
                    {c.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={cn(
                          "group inline-flex items-center gap-1 transition-colors hover:text-ink",
                          active && "text-ink",
                          c.align === "right" && "flex-row-reverse",
                        )}
                      >
                        {c.header}
                        {active && sort!.dir === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" strokeWidth={2} />
                        ) : (
                          <ArrowDown
                            className={cn(
                              "h-3.5 w-3.5 transition-opacity",
                              active ? "opacity-100" : "opacity-0 group-hover:opacity-40",
                            )}
                            strokeWidth={2}
                          />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
              {rowAction ? <th scope="col" className="w-28" aria-label="Actions" /> : null}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => {
              const isSelected = selected.has(row.id);
              const isActive = activeId === row.id;
              return (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? (e) => e.key === "Enter" && onRowClick(row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-selected={isSelected || undefined}
                  className={cn(
                    "admin-row group border-b border-line-soft transition-colors",
                    onRowClick && "cursor-pointer focus-visible:outline-none",
                    isActive
                      ? "bg-panel"
                      : isSelected
                        ? "bg-brand/[0.04]"
                        : onRowClick && "hover:bg-panel/60 focus-visible:bg-panel/60",
                  )}
                  style={{ animationDelay: `${Math.min(i, 12) * 24}ms` }}
                >
                  {selectable ? (
                    <td className="pl-1 pr-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={isSelected}
                        onChange={() => toggle(row.id)}
                        className="h-4 w-4 cursor-pointer accent-ink"
                      />
                    </td>
                  ) : null}
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "h-14 px-3 align-middle",
                        c.align === "right" && "text-right tabular-nums",
                        c.className,
                      )}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                  {rowAction ? (
                    <td className="pr-1 text-right" onClick={(e) => e.stopPropagation()}>
                      {rowAction(row)}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-[13px] text-muted-ink">
        <label className="flex items-center gap-2">
          Rows per page
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="h-8 cursor-pointer rounded-[8px] border border-line-soft bg-paper px-2 text-[13px] text-ink focus:border-ink focus:outline-none"
          >
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <span className="tabular-nums">
            {from}–{to} of {sorted.length}
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
      </div>

      {bulkActions ? (
        <BulkBar
          count={selectedRows.length}
          noun={noun}
          actions={selectedRows.length ? bulkActions(selectedRows) : []}
          onClear={() => setSelected(new Set())}
          onDone={() => setSelected(new Set())}
        />
      ) : null}
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
      className="grid h-8 w-8 place-items-center rounded-[8px] border border-line-soft text-ink transition-colors hover:bg-panel disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}

/** Dark bar that rises from the bottom while rows are selected. Portalled so it pins to the screen. */
function BulkBar({
  count,
  noun,
  actions,
  onClear,
  onDone,
}: {
  count: number;
  noun: [string, string];
  actions: BulkAction[];
  onClear: () => void;
  onDone: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const visible = count > 0;
  return createPortal(
    <div
      role="toolbar"
      aria-label="Bulk actions"
      aria-hidden={!visible}
      className={cn(
        "fixed bottom-6 left-1/2 z-40 flex max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-1 rounded-[14px] bg-ink py-1.5 pl-4 pr-1.5 font-gsf text-sm text-ink-contrast shadow-[0_24px_64px_-16px_rgba(19,14,48,0.55)] transition-[opacity,translate] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] lg:ml-30",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
      )}
    >
      <span className="whitespace-nowrap pr-3 tabular-nums">
        {count} {count === 1 ? noun[0] : noun[1]} selected
      </span>
      <span className="mr-1 h-5 w-px bg-white/15" />
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          tabIndex={visible ? 0 : -1}
          disabled={Boolean(a.disabledReason)}
          title={a.disabledReason}
          onClick={() => {
            a.onSelect();
            if (!a.tone) onDone();
          }}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[9px] px-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
            a.tone === "danger" ? "text-[#FF8A80] hover:bg-white/10" : "hover:bg-white/10",
          )}
        >
          {a.icon ? <a.icon className="h-4 w-4" strokeWidth={1.75} /> : null}
          {a.label}
        </button>
      ))}
      <button
        type="button"
        aria-label="Clear selection"
        tabIndex={visible ? 0 : -1}
        onClick={onClear}
        className="ml-1 grid h-8 w-8 place-items-center rounded-[9px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>,
    document.body,
  );
}
