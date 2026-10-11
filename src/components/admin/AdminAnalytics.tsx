import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { adminApiFetch } from "@/lib/api";
import { formatMoney } from "@/lib/catalog";
import { downloadAdminCsv } from "@/lib/admin-directory";
import { AdminLoadError } from "./AdminLoadError";
import { PageSpinner } from "@/components/PageSpinner";

type Totals = {
  given: number;
  gifts: number;
  users: number;
  organizations: number;
  campaigns: number;
};
type Analytics = {
  range: "7d" | "30d";
  timezone: string;
  from: string;
  through: string;
  current: Totals;
  previous: Totals;
  change: Record<keyof Totals, number | null>;
  series: Array<Totals & { date: string }>;
};
const labels: Record<keyof Totals, string> = {
  given: "Donation volume",
  gifts: "Successful gifts",
  users: "New users",
  organizations: "Organization submissions",
  campaigns: "Campaign submissions",
};
export function AdminAnalytics() {
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [metric, setMetric] = useState<keyof Totals>("given");
  const query = useQuery({
    queryKey: ["admin", "analytics", range],
    queryFn: () => adminApiFetch<Analytics>(`/admin/review/analytics?range=${range}`),
  });
  const data = query.data;
  const format = (value: number, key: keyof Totals) =>
    key === "given" ? formatMoney(value) : value.toLocaleString();
  const maximum = Math.max(1, ...(data?.series.map((point) => point[metric]) ?? []));
  return (
    <section className="space-y-5" aria-label="Platform analytics">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Platform activity</h2>
          <p className="mt-1 text-xs text-muted-ink">
            Successful donations only. Amounts exclude tips and payment fees. Dates are UTC.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["7d", "30d"] as const).map((value) => (
            <button
              key={value}
              className={`giving-small-button ${range === value ? "bg-black text-white" : ""}`}
              aria-pressed={range === value}
              onClick={() => setRange(value)}
            >
              Last {value === "7d" ? "7" : "30"} days
            </button>
          ))}
          <button
            className="giving-small-button"
            disabled={!data || query.isFetching}
            onClick={() => {
              if (data)
                downloadAdminCsv(`azarfaith-analytics-${range}-${data.through.slice(0, 10)}.csv`, [
                  [
                    "Date (UTC)",
                    "Given (NGN)",
                    "Successful gifts",
                    "New users",
                    "Organization submissions",
                    "Campaign submissions",
                  ],
                  ...data.series.map((row) => [
                    row.date,
                    row.given,
                    row.gifts,
                    row.users,
                    row.organizations,
                    row.campaigns,
                  ]),
                ]);
            }}
          >
            <Download size={14} />
            Export report
          </button>
        </div>
      </div>
      {query.isError ? (
        <AdminLoadError retry={() => void query.refetch()} />
      ) : !data ? (
        <PageSpinner fullScreen={false} label="Loading analytics" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {(Object.keys(labels) as Array<keyof Totals>).map((key) => (
              <button
                key={key}
                className={`rounded-xl border bg-white p-5 text-left ${metric === key ? "border-amber-400" : "border-line-soft"}`}
                aria-pressed={metric === key}
                onClick={() => setMetric(key)}
              >
                <span className="text-xs text-muted-ink">{labels[key]}</span>
                <span className="mt-2 block text-2xl font-semibold">
                  {format(data.current[key], key)}
                </span>
                <span
                  className={`mt-2 block text-xs ${data.change[key] === null ? "text-muted-ink" : (data.change[key] ?? 0) >= 0 ? "text-emerald-700" : "text-red-700"}`}
                >
                  {data.change[key] === null
                    ? "No previous-period baseline"
                    : `${(data.change[key] ?? 0) > 0 ? "+" : ""}${data.change[key]}% vs previous period`}
                </span>
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-line-soft bg-white p-5 sm:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">{labels[metric]}</h3>
              <span className="text-xs text-muted-ink">
                {data.from.slice(0, 10)} to {data.through.slice(0, 10)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <div
                className="flex h-52 items-end gap-2"
                style={{ minWidth: range === "30d" ? 660 : 280 }}
              >
                {data.series.map((point, index) => (
                  <div
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                    key={point.date}
                  >
                    <div className="flex h-44 w-full items-end">
                      <div
                        tabIndex={0}
                        role="img"
                        aria-label={`${point.date}: ${format(point[metric], metric)}`}
                        title={`${point.date}: ${format(point[metric], metric)}`}
                        className={`w-full rounded-t-md ${point[metric] ? "bg-amber-400" : "bg-gray-100"}`}
                        style={{
                          height: point[metric]
                            ? `${Math.max(1, (point[metric] / maximum) * 100)}%`
                            : "1px",
                        }}
                      />
                    </div>
                    <span className="h-4 text-[10px] text-muted-ink">
                      {range === "7d" || index % 5 === 0 || index === data.series.length - 1
                        ? point.date.slice(5)
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {data.current[metric] === 0 && (
              <p className="mt-5 text-center text-sm text-muted-ink">
                No activity for this metric in the selected period.
              </p>
            )}
            <details className="mt-5">
              <summary className="cursor-pointer text-xs text-muted-ink">View daily values</summary>
              <div className="mt-3 max-h-56 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="py-2 text-left">Date (UTC)</th>
                      <th className="text-right">{labels[metric]}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.series.map((point) => (
                      <tr key={point.date}>
                        <td className="py-1">{point.date}</td>
                        <td className="text-right">{format(point[metric], metric)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        </>
      )}
    </section>
  );
}
