import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { History } from "lucide-react";
import { useApp } from "@/lib/store";
import { fullDate, timeAgo, type AuditEntry } from "@/lib/admin";
import { pending, simulateNetwork } from "@/lib/api";
import { btn } from "@/components/app/btn";
import { AdminPage } from "@/components/admin/AdminLayout";
import { SearchField, Segmented } from "@/components/admin/AdminFilterBar";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminListSkeleton } from "@/components/admin/AdminSkeletons";
import { actionText } from "@/components/admin/useAdmin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/activity")({
  loader: () => simulateNetwork(),
  pendingComponent: () => <AdminListSkeleton label="Loading activity" />,
  ...pending,
  head: () => ({ meta: [{ title: "Activity log — AzarFaith admin" }] }),
  component: ActivityLog,
});

type Area = "all" | "org" | "campaign" | "user" | "platform";

const tone = (e: AuditEntry) =>
  /verified|approved|reactivated|resumed/.test(e.action)
    ? "bg-verified"
    : /rejected|revoked|suspended|paused/.test(e.action)
      ? "bg-danger"
      : "bg-line-input";

/** Everything the team has done, newest first. The record of who decided what, and why. */
function ActivityLog() {
  const log = useApp((s) => s.auditLog);
  const navigate = useNavigate();
  const [area, setArea] = useState<Area>("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return log.filter(
      (e) =>
        (area === "all" || e.target.kind === area) &&
        (!q || [e.actor, e.target.name, e.detail ?? ""].some((x) => x.toLowerCase().includes(q))),
    );
  }, [log, area, search]);

  const count = (a: Area) =>
    a === "all" ? log.length : log.filter((e) => e.target.kind === a).length;

  const open = (e: AuditEntry) => {
    if (!e.target.id) return;
    const to =
      e.target.kind === "org"
        ? "/admin/orgs/$id"
        : e.target.kind === "campaign"
          ? "/admin/campaigns/$id"
          : "/admin/users/$id";
    navigate({ to, params: { id: e.target.id } });
  };

  const columns: Column<AuditEntry>[] = [
    {
      key: "what",
      header: "What happened",
      cell: (e) => (
        <div className="flex items-start gap-3">
          <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", tone(e))} />
          <p className="min-w-0 text-ink-soft">
            <span className="font-medium text-ink">{e.actor}</span> {actionText[e.action]}
            {e.actor !== e.target.name ? (
              <>
                {" "}
                <span className="font-medium text-ink">{e.target.name}</span>
              </>
            ) : null}
          </p>
        </div>
      ),
    },
    {
      key: "detail",
      header: "Reason or detail",
      className: "hidden md:table-cell max-w-[360px]",
      cell: (e) =>
        e.detail ? (
          <span className="line-clamp-2 text-ink-soft" title={e.detail}>
            {e.detail}
          </span>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "when",
      header: "When",
      align: "right",
      sortValue: (e) => e.at,
      cell: (e) => (
        <time dateTime={e.at} title={fullDate(e.at)} className="whitespace-nowrap text-ink-soft">
          {timeAgo(e.at)}
        </time>
      ),
    },
  ];

  return (
    <AdminPage
      title="Activity log"
      count={rows.length}
      lead="Every decision the team makes, with the reason. Nothing here can be edited."
      crumbs={[{ label: "Activity log" }]}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          value={area}
          onChange={setArea}
          items={[
            { value: "all", label: "Everything", count: count("all") },
            { value: "org", label: "Organizations", count: count("org") },
            { value: "campaign", label: "Campaigns", count: count("campaign") },
            { value: "user", label: "Users", count: count("user") },
            { value: "platform", label: "Platform", count: count("platform") },
          ]}
        />
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search people, records, reasons"
        />
      </div>

      <AdminTable
        label="Activity log"
        noun={["entry", "entries"]}
        rows={rows}
        columns={columns}
        onRowClick={open}
        initialSort={{ key: "when", dir: "desc" }}
        mobileRow={(e) => (
          <div className="flex items-start gap-3">
            <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", tone(e))} />
            <div className="min-w-0">
              <p className="text-sm text-ink-soft">
                <span className="font-medium text-ink">{e.actor}</span> {actionText[e.action]}
                {e.actor !== e.target.name ? (
                  <>
                    {" "}
                    <span className="font-medium text-ink">{e.target.name}</span>
                  </>
                ) : null}
              </p>
              <p className="text-[12px] text-subtle">{timeAgo(e.at)}</p>
            </div>
          </div>
        )}
        empty={
          <AdminEmptyState
            icon={<History className="h-5 w-5" strokeWidth={1.75} />}
            title={search ? "Nothing matches" : "No activity yet"}
            description={
              search
                ? "Try a different name or word."
                : "Decisions show up here the moment they're made."
            }
            action={
              search ? (
                <button
                  type="button"
                  className={btn("secondary", "sm")}
                  onClick={() => setSearch("")}
                >
                  Clear search
                </button>
              ) : undefined
            }
          />
        }
      />
    </AdminPage>
  );
}
