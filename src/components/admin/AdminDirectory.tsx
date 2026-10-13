import { useDeferredValue, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Download, Eye, Search, ShieldCheck, ShieldX } from "lucide-react";
import { adminApiFetch } from "@/lib/api";
import { formatMoney } from "@/lib/catalog";
import {
  downloadAdminCsv,
  type BulkResult,
  type DirectoryEntity,
  type DirectoryPage,
  type DirectoryRow,
} from "@/lib/admin-directory";
import { AdminPageWrapper } from "./AdminLayout";
import { AdminLoadError } from "./AdminLoadError";
import { AdminBadge, StatusBadge } from "./AdminBadge";
import { AdminPagination } from "./AdminPagination";
import { PageSpinner } from "@/components/PageSpinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Action = "approve" | "reject" | "request_info" | "suspend" | "reactivate";
const names = { organization: "Organizations", campaign: "Campaigns", user: "Users" };
const labels: Record<Action, string> = {
  approve: "Approve",
  reject: "Reject",
  request_info: "Request changes",
  suspend: "Suspend",
  reactivate: "Reactivate",
};
const titleCase = (value: string | null) =>
  value?.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) ?? "-";

export function AdminDirectory({
  entity,
  initialStatus = "",
}: {
  entity: DirectoryEntity;
  initialStatus?: string;
}) {
  const client = useQueryClient();
  const [filters, setFilters] = useState<Record<string, string>>({
    search: "",
    status: initialStatus,
    category: "",
    mode: "",
    type: "",
    role: "",
    emailVerified: "",
    location: "",
    from: "",
    to: "",
  });
  const deferredSearch = useDeferredValue(filters.search);
  const [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState(entity === "campaign" ? "priority" : "createdAt");
  const [direction, setDirection] = useState(entity === "campaign" ? "asc" : "desc");
  const [selected, setSelected] = useState<DirectoryRow[]>([]);
  const [dialog, setDialog] = useState<{
    action: Action;
    requestId: string;
    rows: DirectoryRow[];
  } | null>(null);
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<BulkResult | null>(null);
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sort,
    direction,
  });
  for (const [key, value] of Object.entries({ ...filters, search: deferredSearch }))
    if (value)
      params.set(
        key,
        key === "from" ? `${value}T00:00:00.000Z` : key === "to" ? `${value}T23:59:59.999Z` : value,
      );
  const query = useQuery({
    queryKey: ["admin", "directory", entity, params.toString()],
    queryFn: () => adminApiFetch<DirectoryPage>(`/admin/review/directory/${entity}?${params}`),
  });
  const items = query.data?.items ?? [];
  const update = (key: string, value: string) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
    setSelected([]);
    setResult(null);
  };
  const bulk = useMutation({
    mutationFn: (request: NonNullable<typeof dialog>) =>
      adminApiFetch<BulkResult>(`/admin/review/directory/${entity}/bulk`, {
        method: "POST",
        body: JSON.stringify({
          action: request.action,
          requestId: request.requestId,
          reason: reason.trim() || undefined,
          records: request.rows.map((row) => ({ id: row.id, version: row.updatedAt })),
        }),
      }),
    onSuccess: (response) => {
      setResult(response);
      setDialog(null);
      setSelected([]);
      void client.invalidateQueries({ queryKey: ["admin"] });
    },
  });
  const open = (action: Action, rows: DirectoryRow[]) => {
    bulk.reset();
    setReason("");
    setDialog({ action, rows, requestId: crypto.randomUUID() });
  };
  const selectable = (row: DirectoryRow) =>
    entity === "user" ? row.category !== "platform_admin" : row.status === "pending";
  const select = (row: DirectoryRow, checked: boolean) =>
    setSelected((rows) =>
      checked
        ? [...rows.filter((old) => old.id !== row.id), row]
        : rows.filter((old) => old.id !== row.id),
    );
  const sortBy = (key: string) => {
    setSort(key);
    setDirection(sort === key && direction === "asc" ? "desc" : "asc");
    setPage(1);
    setSelected([]);
  };
  const sortButton = (key: string, label: string) => (
    <button className="flex items-center gap-2 text-left" onClick={() => sortBy(key)}>
      {label}
      {sort === key && (direction === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
    </button>
  );
  const selectFilter = (key: string, label: string, values: string[]) => (
    <label className="giving-label" key={key}>
      <span className="text-xs">{label}</span>
      <select
        aria-label={label}
        className="giving-input"
        value={filters[key]}
        onChange={(event) => update(key, event.target.value)}
      >
        <option value="">All</option>
        {values.map((value) => (
          <option value={value} key={value}>
            {titleCase(value)}
          </option>
        ))}
      </select>
    </label>
  );
  const badge = (row: DirectoryRow) =>
    row.status === "active" || row.status === "suspended" ? (
      <AdminBadge variant={row.status}>{titleCase(row.status)}</AdminBadge>
    ) : (
      <StatusBadge status={row.status} />
    );
  const rowActions = (row: DirectoryRow) => (
    <div className="flex flex-wrap justify-end gap-2">
      <Link
        to={
          entity === "organization"
            ? "/admin/orgs/$id"
            : entity === "campaign"
              ? "/admin/campaigns/$id"
              : "/admin/users/$id"
        }
        params={{ id: row.id }}
        className="giving-small-button"
        aria-label={`${entity === "user" ? "View" : "Review"} ${row.name}`}
      >
        <Eye size={15} />
        Review
      </Link>
      {selectable(row) &&
        (entity === "user" ? (
          <button
            className="giving-small-button text-red-700"
            disabled={bulk.isPending}
            onClick={() => open(row.status === "active" ? "suspend" : "reactivate", [row])}
            aria-label={`${row.status === "active" ? "Suspend" : "Reactivate"} ${row.name}`}
          >
            <ShieldX size={15} />
          </button>
        ) : (
          <>
            <button
              className="giving-small-button text-emerald-700"
              disabled={bulk.isPending || row.checks !== 4}
              title={row.checks === 4 ? "Approve" : "Complete review checks before approval"}
              aria-label={`Approve ${row.name}`}
              onClick={() => open("approve", [row])}
            >
              <ShieldCheck size={15} />
            </button>
            <button
              className="giving-small-button text-red-700"
              disabled={bulk.isPending}
              aria-label={`Reject ${row.name}`}
              onClick={() => open("reject", [row])}
            >
              <ShieldX size={15} />
            </button>
          </>
        ))}
    </div>
  );
  const exportRows = () =>
    downloadAdminCsv(`azarfaith-${entity}-${selected.length ? "selected" : `page-${page}`}.csv`, [
      [
        "ID",
        "Name",
        "Contact or location",
        "Status",
        "Category or role",
        "Amount (NGN)",
        "Gifts",
        "Created (UTC)",
        "Submitted (UTC)",
      ],
      ...(selected.length ? selected : items).map((row) => [
        row.id,
        row.name,
        row.detail,
        row.status,
        row.category ?? row.type ?? "",
        row.amount,
        row.count,
        row.createdAt,
        row.submittedAt ?? "",
      ]),
    ]);
  const eligible = items.filter(selectable);
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));
  const selectCheckbox = (row: DirectoryRow) => (
    <input
      type="checkbox"
      disabled={!selectable(row) || bulk.isPending}
      aria-label={`Select ${row.name}`}
      checked={selected.some((old) => old.id === row.id)}
      onChange={(event) => select(row, event.target.checked)}
    />
  );
  return (
    <AdminPageWrapper
      title={names[entity]}
      lead="Review real submissions, track decisions and export the records shown here."
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-3 text-muted-ink" size={16} />
            <input
              className="giving-input w-full pl-10"
              aria-label={`Search ${names[entity].toLowerCase()}`}
              placeholder={`Search ${names[entity].toLowerCase()}...`}
              value={filters.search}
              onChange={(event) => update("search", event.target.value)}
            />
          </label>
          <button
            className="giving-small-button"
            disabled={!items.length || query.isFetching}
            onClick={exportRows}
          >
            <Download size={15} />
            Export {selected.length ? "selected" : "this page"}
          </button>
        </div>
        <div className="grid gap-3 rounded-xl border border-line-soft bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
          {selectFilter(
            "status",
            "Status",
            entity === "user"
              ? ["ACTIVE", "SUSPENDED"]
              : ["PENDING", "VERIFIED", "UNVERIFIED", "REJECTED"],
          )}
          {entity === "organization" &&
            selectFilter("category", "Category", [
              "CHURCH",
              "MISSION",
              "ORPHANAGE",
              "SCHOOL",
              "OTHER",
            ])}
          {entity === "campaign" && (
            <>
              {selectFilter("mode", "Mode", ["ONE_TIME", "ONGOING"])}
              {selectFilter("type", "Type", [
                "MONEY",
                "ITEM",
                "VOLUNTEER",
                "PROFESSIONAL",
                "EMERGENCY",
              ])}
            </>
          )}
          {entity === "user" && (
            <>
              {selectFilter("role", "Role", ["DONOR", "ORG_ADMIN", "PLATFORM_ADMIN"])}
              {selectFilter("emailVerified", "Email verification", ["verified", "unverified"])}
            </>
          )}
          {entity !== "user" && (
            <label className="giving-label">
              <span className="text-xs">Location</span>
              <input
                className="giving-input"
                value={filters.location}
                onChange={(event) => update("location", event.target.value)}
                placeholder="City or state"
              />
            </label>
          )}
          <label className="giving-label">
            <span className="text-xs">Created from (UTC)</span>
            <input
              type="date"
              className="giving-input"
              value={filters.from}
              onChange={(event) => update("from", event.target.value)}
            />
          </label>
          <label className="giving-label">
            <span className="text-xs">Created through (UTC)</span>
            <input
              type="date"
              className="giving-input"
              value={filters.to}
              onChange={(event) => update("to", event.target.value)}
            />
          </label>
          <label className="giving-label">
            <span className="text-xs">Sort by</span>
            <select
              className="giving-input"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
                setSelected([]);
              }}
            >
              {[
                "createdAt",
                "name",
                "amount",
                "count",
                ...(entity !== "user" ? ["submittedAt"] : []),
                ...(entity === "campaign" ? ["priority"] : []),
              ].map((key) => (
                <option key={key} value={key}>
                  {
                    (
                      {
                        createdAt: "Created date",
                        submittedAt: "Submitted date",
                        name: "Name",
                        amount: "Amount",
                        count: "Gifts",
                        priority: "Urgency",
                      } as Record<string, string>
                    )[key]
                  }
                </option>
              ))}
            </select>
          </label>
          <button
            className="giving-small-button self-end"
            onClick={() => {
              setFilters(Object.fromEntries(Object.keys(filters).map((key) => [key, ""])));
              setSelected([]);
              setPage(1);
            }}
          >
            Clear filters
          </button>
        </div>
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <span className="mr-auto text-sm font-medium">
              {selected.length} selected on this page
            </span>
            {(entity === "user"
              ? ["suspend", "reactivate"]
              : ["approve", "reject", "request_info"]
            ).map((action) => (
              <button
                key={action}
                className="giving-small-button"
                disabled={
                  bulk.isPending ||
                  (action === "approve" && selected.some((row) => row.checks !== 4))
                }
                title={
                  action === "approve" ? "Every selected record needs completed checks" : undefined
                }
                onClick={() => open(action as Action, selected)}
              >
                {labels[action as Action]}
              </button>
            ))}
          </div>
        )}
        {result && (
          <div role="status" className="rounded-xl border border-line-soft p-4 text-sm">
            <p>
              {result.applied} decision{result.applied === 1 ? "" : "s"} saved, {result.failed} not
              applied.
            </p>
            {result.results
              .filter((row) => row.outcome === "failed")
              .map((row) => (
                <p key={row.id} className="mt-2 text-red-700">
                  {row.id}: {row.message}
                </p>
              ))}
          </div>
        )}
        {query.isError ? (
          <AdminLoadError retry={() => void query.refetch()} />
        ) : query.isPending ? (
          <PageSpinner label={`Loading ${names[entity].toLowerCase()}`} fullScreen={false} />
        ) : (
          <>
            {items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line-soft p-10 text-center text-sm text-muted-ink">
                No matching records.{" "}
                {page > 1 && (
                  <button className="underline" onClick={() => setPage(1)}>
                    Return to the first page
                  </button>
                )}
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-line-soft bg-white">
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs text-muted-ink">
                      <tr>
                        <th className="p-4">
                          <input
                            type="checkbox"
                            aria-label="Select reviewable records on this page"
                            disabled={!eligible.length || bulk.isPending}
                            checked={
                              eligible.length > 0 &&
                              eligible.every((row) => selected.some((old) => old.id === row.id))
                            }
                            onChange={(event) => setSelected(event.target.checked ? eligible : [])}
                          />
                        </th>
                        {[
                          [
                            "name",
                            entity === "user"
                              ? "User"
                              : entity === "campaign"
                                ? "Campaign"
                                : "Organization",
                          ],
                          ["status", "Status"],
                          ["category", entity === "user" ? "Role / email" : "Category / checks"],
                          ["amount", entity === "user" ? "Given" : "Received"],
                          ["count", "Gifts"],
                          ["createdAt", "Created"],
                        ].map(([key, label]) => (
                          <th
                            key={key}
                            className="p-4"
                            aria-sort={
                              sort === key
                                ? direction === "asc"
                                  ? "ascending"
                                  : "descending"
                                : "none"
                            }
                          >
                            {["status", "category"].includes(key) ? label : sortButton(key, label)}
                          </th>
                        ))}
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row) => (
                        <tr
                          key={row.id}
                          className={`border-t border-line-soft ${row.urgency === "critical" ? "bg-red-50/40" : ""}`}
                        >
                          <td className="p-4">{selectCheckbox(row)}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {row.image ? (
                                <img
                                  src={row.image}
                                  alt=""
                                  className="h-9 w-9 shrink-0 rounded-lg object-cover"
                                />
                              ) : (
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-50 font-medium">
                                  {row.name.slice(0, 1)}
                                </span>
                              )}
                              <div className="max-w-[260px]">
                                <p className="truncate font-medium" title={row.name}>
                                  {row.name}
                                </p>
                                <p className="truncate text-xs text-muted-ink">{row.detail}</p>
                                {row.urgency && ["high", "critical"].includes(row.urgency) && (
                                  <span className="text-xs font-medium text-red-700">
                                    {titleCase(row.urgency)} urgency
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">{badge(row)}</td>
                          <td className="p-4 text-xs">
                            <p>{titleCase(row.category ?? row.type)}</p>
                            <p className="mt-1 text-muted-ink">
                              {entity === "user"
                                ? row.emailVerified
                                  ? "Email verified"
                                  : "Email not verified"
                                : `${row.checks}/4 checks · ${row.mode ? titleCase(row.mode) : "Review"}`}
                            </p>
                          </td>
                          <td className="whitespace-nowrap p-4 font-medium">
                            {formatMoney(row.amount)}
                          </td>
                          <td className="p-4">{row.count.toLocaleString()}</td>
                          <td className="whitespace-nowrap p-4 text-xs text-muted-ink">
                            {new Date(row.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">{rowActions(row)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="divide-y divide-line-soft lg:hidden">
                  {items.map((row) => (
                    <article key={row.id} className="space-y-4 p-5">
                      <div className="flex items-start gap-3">
                        {selectCheckbox(row)}
                        <div className="min-w-0 flex-1">
                          <h2 className="font-medium">{row.name}</h2>
                          <p className="mt-1 break-words text-xs text-muted-ink">{row.detail}</p>
                        </div>
                        {badge(row)}
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                        <span>{formatMoney(row.amount)}</span>
                        <span>{row.count.toLocaleString()} gifts</span>
                        <span className="text-xs text-muted-ink">
                          {entity === "user" ? titleCase(row.category) : `${row.checks}/4 checks`}
                        </span>
                      </div>
                      {rowActions(row)}
                    </article>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-muted-ink">
                <span className="mr-3">
                  Page {page} of {totalPages}
                </span>
                {query.data.total.toLocaleString()} matching records
                {query.isFetching ? " · Updating..." : ""}
              </p>
              <label className="flex items-center gap-2 text-xs">
                Per page
                <select
                  aria-label="Records per page"
                  className="giving-input py-1"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                    setSelected([]);
                  }}
                >
                  {[10, 25, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <AdminPagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(value) => {
                  setPage(value);
                  setSelected([]);
                }}
              />
            </div>
          </>
        )}
      </div>
      <Dialog
        open={Boolean(dialog)}
        onOpenChange={(value) => {
          if (!value && !bulk.isPending) setDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog ? labels[dialog.action] : "Review"} {dialog?.rows.length} record
              {dialog?.rows.length === 1 ? "" : "s"}?
            </DialogTitle>
            <DialogDescription>
              Each record is checked again on the server. Changed records are left untouched. Every
              applied decision is audited and its notifications are queued.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (
                dialog &&
                (["approve", "reactivate"].includes(dialog.action) || reason.trim().length >= 5)
              )
                bulk.mutate(dialog);
            }}
          >
            <div className="max-h-40 overflow-y-auto rounded-lg bg-gray-50 p-3 text-sm">
              {dialog?.rows.map((row) => (
                <p key={row.id} className="py-1">
                  {row.name}
                </p>
              ))}
            </div>
            <label className="giving-label">
              Reason{" "}
              {["approve", "reactivate"].includes(dialog?.action ?? "")
                ? "(optional)"
                : "(required)"}
              <textarea
                className="giving-input"
                maxLength={1000}
                minLength={["approve", "reactivate"].includes(dialog?.action ?? "") ? undefined : 5}
                required={!["approve", "reactivate"].includes(dialog?.action ?? "")}
                disabled={bulk.isPending}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
            {bulk.isError && (
              <p role="alert" className="text-sm text-red-700">
                {bulk.error.message} Your selections are retained. Retry uses the same request ID.
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                className="giving-small-button"
                type="button"
                disabled={bulk.isPending}
                onClick={() => setDialog(null)}
              >
                Cancel
              </button>
              <button
                className="giving-small-button bg-black text-white"
                disabled={
                  bulk.isPending ||
                  (!["approve", "reactivate"].includes(dialog?.action ?? "") &&
                    reason.trim().length < 5)
                }
              >
                {bulk.isPending ? "Applying..." : "Confirm"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageWrapper>
  );
}
