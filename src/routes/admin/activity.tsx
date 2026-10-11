import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAdminActivity } from "@/features/catalog/api";
import { AdminPageWrapper } from "@/components/admin/AdminLayout";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { PageSpinner } from "@/components/PageSpinner";
import { auditTarget, humanizeAdminAction } from "@/lib/admin";

export const Route = createFileRoute("/admin/activity")({ component: AdminActivity });
function AdminActivity() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const filters = {
    page,
    pageSize: 20,
    entityType: entityType || undefined,
    action: action.trim() || undefined,
    from: from ? `${from}T00:00:00.000Z` : undefined,
    to: to ? `${to}T23:59:59.999Z` : undefined,
  };
  const query = useQuery({
    queryKey: ["admin", "activity", filters],
    queryFn: () => getAdminActivity(filters),
  });
  return (
    <AdminPageWrapper
      title="Activity log"
      lead="Recorded admin decisions, account changes, settings and payout actions. Dates use UTC."
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="giving-label">
          Record type
          <select
            className="giving-input"
            value={entityType}
            onChange={(event) => {
              setEntityType(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All types</option>
            {["user", "organization", "campaign", "platform_settings"].map((value) => (
              <option key={value} value={value}>
                {humanizeAdminAction(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="giving-label">
          Action code
          <input
            className="giving-input"
            placeholder="e.g. ORGANIZATION_APPROVED"
            maxLength={80}
            value={action}
            onChange={(event) => {
              setAction(event.target.value.toUpperCase());
              setPage(1);
            }}
          />
        </label>
        <label className="giving-label">
          From date
          <input
            className="giving-input"
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="giving-label">
          To date
          <input
            className="giving-input"
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
          />
        </label>
      </div>
      {query.isPending ? (
        <PageSpinner label="Loading activity" fullScreen={false} />
      ) : query.isError ? (
        <AdminLoadError
          retry={() => void query.refetch()}
          message="Could not load activity. Check the date range and try again."
        />
      ) : (
        query.data && (
          <>
            <p className="mb-4 text-xs text-muted-ink">
              {query.data.total.toLocaleString()} recorded actions
            </p>
            {!query.data.items.length ? (
              <p className="rounded-xl border border-dashed border-line-input p-8 text-center text-sm text-muted-ink">
                No recorded actions match these filters.
              </p>
            ) : (
              <ol className="divide-y divide-line-soft rounded-xl border border-line-soft">
                {query.data.items.map((item) => (
                  <li key={item.id} className="grid gap-3 p-5 sm:grid-cols-[160px_1fr]">
                    <time dateTime={item.createdAt} className="text-xs text-muted-ink">
                      {new Date(item.createdAt).toLocaleString("en-NG", { timeZone: "UTC" })} UTC
                    </time>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold">{humanizeAdminAction(item.action)}</h2>
                      <p className="mt-1 break-all text-xs text-muted-ink">
                        {item.actor.fullName} · {item.actor.email}
                      </p>
                      <Link
                        to={auditTarget(item) as "/admin"}
                        className="mt-2 inline-block max-w-full break-words text-sm underline underline-offset-4"
                      >
                        {item.entityLabel ?? item.entityId}
                      </Link>
                      {item.reason && (
                        <p className="mt-3 break-words rounded-lg bg-panel p-3 text-sm leading-relaxed">
                          {item.reason}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-5 flex items-center justify-between gap-3 text-sm">
              <button
                type="button"
                className="giving-small-button"
                disabled={page === 1 || query.isFetching}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </button>
              <p>Page {query.data.page}</p>
              <button
                type="button"
                className="giving-small-button"
                disabled={!query.data.hasMore || query.isFetching}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </button>
            </div>
          </>
        )
      )}
    </AdminPageWrapper>
  );
}
