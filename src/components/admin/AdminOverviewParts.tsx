import { cn } from "@/lib/utils";
import { auditPhrase, relativeAdminTime, type OverviewAudit } from "@/lib/admin-overview";
export function CheckMeter({ passed, total = 4 }: { passed: number; total?: number }) {
  passed = Math.min(Math.max(0, passed), total);
  if (!total) return <span className="text-muted-ink">No checks</span>;
  return (
    <span className="inline-flex items-center gap-2 text-[13px]">
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn("h-1.5 w-3 rounded-full", i < passed ? "bg-verified" : "bg-line-soft")}
          />
        ))}
      </span>
      <span className={cn("tabular-nums", "text-ink-soft")}>
        {passed} of {total}
      </span>
    </span>
  );
}

const dotTone: Partial<Record<string, string>> = {
  ORGANIZATION_APPROVED: "bg-verified",
  CAMPAIGN_APPROVED: "bg-verified",
  USER_REACTIVATED: "bg-verified",
  ORGANIZATION_REJECTED: "bg-danger",
  ORGANIZATION_REVOKED: "bg-danger",
  CAMPAIGN_REJECTED: "bg-danger",
  USER_SUSPENDED: "bg-danger",
  GIVING_PAUSED: "bg-danger",
};

/** Vertical timeline of audit entries. `showTarget` adds the record name for global feeds. */
export function Timeline({
  entries,
  showTarget = false,
  empty = "No activity yet.",
}: {
  entries: OverviewAudit[];
  showTarget?: boolean;
  empty?: string;
}) {
  if (!entries.length) {
    return <p className="py-10 text-center text-sm text-muted-ink">{empty}</p>;
  }
  return (
    <ol className="relative flex flex-col">
      {entries.map((e, i) => (
        <li
          key={e.id}
          className="admin-row relative flex gap-3 pb-5 last:pb-0"
          style={{ animationDelay: `${i * 30}ms` }}
        >
          {i < entries.length - 1 ? (
            <span aria-hidden className="absolute left-[5px] top-4 h-full w-px bg-line-soft" />
          ) : null}
          <span
            aria-hidden
            className={cn(
              "relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ring-4 ring-paper",
              dotTone[e.action] ?? "bg-line-input",
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-soft">
              <span className="font-medium text-ink">{e.actor.fullName}</span>{" "}
              {auditPhrase(e.action)}
              {(showTarget || e.entityType === "platform") && e.actor.fullName !== e.entityLabel ? (
                <>
                  {" "}
                  <span className="font-medium text-ink">{e.entityLabel ?? e.entityId}</span>
                </>
              ) : null}
            </p>
            {e.reason ? <p className="mt-0.5 text-[13px] text-muted-ink">{e.reason}</p> : null}
            <time
              dateTime={e.createdAt}
              title={new Date(e.createdAt).toLocaleString("en-NG")}
              className="mt-0.5 block text-[12px] text-subtle"
            >
              {relativeAdminTime(e.createdAt)}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
