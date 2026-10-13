import type { AdminAuditPage } from "@/features/catalog/api";
import { formatMoney } from "./catalog";
export type AnalyticsTotals = {
  given: number;
  gifts: number;
  users: number;
  organizations: number;
  campaigns: number;
};
export type AdminAnalyticsData = {
  range: "7d" | "30d";
  timezone: string;
  from: string;
  through: string;
  current: AnalyticsTotals;
  previous: AnalyticsTotals;
  change: Record<keyof AnalyticsTotals, number | null>;
  series: Array<AnalyticsTotals & { date: string }>;
};
export function overviewSeries(data: AdminAnalyticsData, metric: keyof AnalyticsTotals = "given") {
  const size = data.range === "30d" ? 7 : 1;
  const result: { label: string; value: number }[] = [];
  for (let i = 0; i < data.series.length; i += size) {
    const rows = data.series.slice(i, i + size),
      date = new Date(rows[0].date + "T00:00:00Z");
    result.push({
      label: date.toLocaleDateString("en-US", {
        timeZone: "UTC",
        ...(size === 1
          ? { weekday: "short" as const }
          : { month: "short" as const, day: "numeric" as const }),
      }),
      value: rows.reduce((n, p) => n + p[metric], 0),
    });
  }
  return result;
}
export function overviewStrip(data: AdminAnalyticsData) {
  return (
    [
      { key: "given", label: "Given" },
      { key: "gifts", label: "Gifts" },
      { key: "users", label: "New users" },
      { key: "organizations", label: "New organizations" },
    ] as const
  ).map(({ key, label }) => ({
    label,
    value: key === "given" ? formatMoney(data.current[key]) : data.current[key].toLocaleString(),
    delta:
      (key === "given" || key === "gifts") && data.change[key] !== null
        ? Math.abs(data.change[key]!).toLocaleString() + "%"
        : undefined,
    up: (data.change[key] ?? 0) >= 0,
  }));
}
export function relativeAdminTime(value: string, now = Date.now()) {
  const at = Date.parse(value);
  if (!Number.isFinite(at)) return "Date unavailable";
  const minutes = Math.floor(Math.max(0, now - at) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return minutes + "m ago";
  if (minutes < 1440) return Math.floor(minutes / 60) + "h ago";
  return Math.floor(minutes / 1440) + "d ago";
}
export function formatCompactMoney(value: number) {
  return (
    "₦" +
    Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 }).format(value)
  );
}
export type OverviewAudit = AdminAuditPage["items"][number];
export function auditPhrase(action: string) {
  return (
    (
      {
        ORGANIZATION_APPROVED: "verified",
        ORGANIZATION_REJECTED: "rejected",
        CAMPAIGN_APPROVED: "approved",
        CAMPAIGN_REJECTED: "rejected",
        USER_SUSPENDED: "suspended",
        USER_REACTIVATED: "reactivated",
        INTERNAL_NOTE_ADDED: "added a note to",
        REVIEW_CHECK_UPDATED: "updated review checks for",
      } as Record<string, string>
    )[action] ?? action.toLowerCase().replaceAll("_", " ")
  );
}
