import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { History } from "lucide-react";
import { apiFetch, pending } from "@/lib/api";
import { btn } from "@/components/app/btn";
import { AdminPage } from "@/components/admin/AdminLayout";
import { SearchField, Segmented } from "@/components/admin/AdminFilterBar";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminListSkeleton } from "@/components/admin/AdminSkeletons";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/activity")({
  pendingComponent: () => <AdminListSkeleton label="Loading activity" />,
  ...pending,
  head: () => ({ meta: [{ title: "Activity log — AzarFaith admin" }] }),
  component: ActivityLog,
});
type Area = "all" | "organization" | "campaign" | "user" | "platform_settings";
type Activity = {
  id: string;
  action: string;
  entityType: Exclude<Area, "all">;
  entityId: string;
  entityLabel: string;
  reason: string | null;
  actor: { fullName: string; email: string };
  createdAt: string;
};
const emptyActivity: Activity[] = [];
const actionLabel = (action: string) =>
  action
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
const tone = (entry: Activity) =>
  /verified|approved|reactivated|resumed/.test(entry.action.toLowerCase())
    ? "bg-verified"
    : /rejected|revoked|suspended|paused/.test(entry.action.toLowerCase())
      ? "bg-danger"
      : "bg-line-input";

function ActivityLog() {
  const navigate = useNavigate();
  const [area, setArea] = useState<Area>("all");
  const [search, setSearch] = useState("");
  const activity = useQuery({
    queryKey: ["admin", "activity"],
    queryFn: () => apiFetch<{ items: Activity[] }>("/admin/review/activity?page=1&pageSize=50"),
  });
  const entries = activity.data?.items ?? emptyActivity;
  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter(
      (entry) =>
        (area === "all" || entry.entityType === area) &&
        (!query ||
          [entry.actor.fullName, entry.entityLabel, entry.reason ?? "", entry.action].some(
            (value) => value.toLowerCase().includes(query),
          )),
    );
  }, [entries, area, search]);
  if (activity.isLoading) return <AdminListSkeleton label="Loading activity" />;
  if (activity.error) throw activity.error;
  const count = (target: Area) =>
    target === "all"
      ? entries.length
      : entries.filter((entry) => entry.entityType === target).length;
  const open = (entry: Activity) => {
    const to =
      entry.entityType === "organization"
        ? "/admin/orgs/$id"
        : entry.entityType === "campaign"
          ? "/admin/campaigns/$id"
          : entry.entityType === "user"
            ? "/admin/users/$id"
            : null;
    if (to) navigate({ to, params: { id: entry.entityId } });
  };
  const columns: Column<Activity>[] = [
    {
      key: "what",
      header: "What happened",
      cell: (entry) => (
        <div className="flex items-start gap-3">
          <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", tone(entry))} />
          <p className="min-w-0 text-ink-soft">
            <span className="font-medium text-ink">{entry.actor.fullName}</span>{" "}
            {actionLabel(entry.action)}
            <span className="font-medium text-ink"> {entry.entityLabel}</span>
          </p>
        </div>
      ),
    },
    {
      key: "detail",
      header: "Reason or detail",
      className: "hidden md:table-cell max-w-[360px]",
      cell: (entry) =>
        entry.reason ? (
          <span className="line-clamp-2 text-ink-soft" title={entry.reason}>
            {entry.reason}
          </span>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "when",
      header: "When",
      align: "right",
      sortValue: (entry) => entry.createdAt,
      cell: (entry) => (
        <time dateTime={entry.createdAt} className="whitespace-nowrap text-ink-soft">
          {new Date(entry.createdAt).toLocaleString("en-NG", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
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
            { value: "organization", label: "Organizations", count: count("organization") },
            { value: "campaign", label: "Campaigns", count: count("campaign") },
            { value: "user", label: "Users", count: count("user") },
            { value: "platform_settings", label: "Platform", count: count("platform_settings") },
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
        mobileRow={(entry) => (
          <div className="flex items-start gap-3">
            <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", tone(entry))} />
            <div className="min-w-0">
              <p className="text-sm text-ink-soft">
                <span className="font-medium text-ink">{entry.actor.fullName}</span>{" "}
                {actionLabel(entry.action)}
              </p>
              <p className="text-[12px] text-subtle">
                {new Date(entry.createdAt).toLocaleString("en-NG", { dateStyle: "medium" })}
              </p>
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
