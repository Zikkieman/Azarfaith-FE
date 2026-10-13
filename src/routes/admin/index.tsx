import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/app/hooks";
import { formatMoney } from "@/lib/catalog";
import { adminApiFetch } from "@/lib/api";
import { getAdminActivity, getAdminDashboard } from "@/features/catalog/api";
import type { DirectoryPage } from "@/lib/admin-directory";
import {
  overviewSeries,
  overviewStrip,
  relativeAdminTime as timeAgo,
  formatCompactMoney,
  type AdminAnalyticsData,
  type AnalyticsTotals,
} from "@/lib/admin-overview";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { Photo } from "@/components/app/Photo";
import { Bone } from "@/components/app/Skeletons";
import { downloadAdminCsv } from "@/lib/admin-directory";
import { btn } from "@/components/app/btn";
import { AdminPage } from "@/components/admin/AdminLayout";
import { AdminColumnChart } from "@/components/admin/AdminOverviewChart";
import { AdminDashboardSkeleton } from "@/components/admin/AdminSkeletons";
import { CheckMeter, Timeline } from "@/components/admin/AdminOverviewParts";
import { Segmented } from "@/components/admin/AdminSegments";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/app/DesignDialog";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Overview — AzarFaith admin" }] }),
  component: AdminOverview,
});

type Range = "7d" | "30d";

function AdminOverview() {
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === "platform_admin";
  const [range, setRange] = useState<Range>("7d");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMetric, setReportMetric] = useState<keyof AnalyticsTotals>("given");
  const orgs = useQuery({
    enabled: isAdmin,
    queryKey: ["admin", "overview-queue", "organization", user?.id],
    queryFn: () =>
      adminApiFetch<DirectoryPage>(
        "/admin/review/directory/organization?status=PENDING&pageSize=4&page=1&sort=createdAt&direction=asc",
      ),
  });
  const campaigns = useQuery({
    enabled: isAdmin,
    queryKey: ["admin", "overview-queue", "campaign", user?.id],
    queryFn: () =>
      adminApiFetch<DirectoryPage>(
        "/admin/review/directory/campaign?status=PENDING&pageSize=4&page=1&sort=priority&direction=asc",
      ),
  });
  const analytics = useQuery({
    enabled: isAdmin,
    queryKey: ["admin", "analytics", user?.id, range],
    queryFn: () => adminApiFetch<AdminAnalyticsData>("/admin/review/analytics?range=" + range),
  });
  const activity = useQuery({
    enabled: isAdmin,
    queryKey: ["admin", "activity", "overview", user?.id],
    queryFn: () => getAdminActivity({ page: 1, pageSize: 6 }),
  });
  const totals = useQuery({
    enabled: isAdmin,
    queryKey: ["admin", "dashboard"],
    queryFn: getAdminDashboard,
  });
  const waitingOrgs = orgs.data?.items ?? [],
    waitingCampaigns = campaigns.data?.items ?? [];
  const series = analytics.data ? overviewSeries(analytics.data) : [];
  const strip = analytics.data ? overviewStrip(analytics.data) : [];
  if (!isAdmin) return null;
  if ([orgs, campaigns, analytics, activity].every((q) => q.isPending))
    return <AdminDashboardSkeleton />;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const waiting = orgs.data && campaigns.data ? orgs.data.total + campaigns.data.total : undefined;

  return (
    <AdminPage
      title={`${greeting}, ${user?.fullName.split(" ")[0] || "admin"}`}
      lead={
        <>
          {today}.{" "}
          {waiting === undefined
            ? "Review queues are unavailable or loading."
            : waiting
              ? `${waiting} thing${waiting > 1 ? "s are" : " is"} waiting for you.`
              : "Nothing is waiting for you."}
        </>
      }
      crumbs={[{ label: "Overview" }]}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Queue
          title="Organizations to verify"
          count={orgs.data?.total}
          loading={orgs.isPending}
          error={orgs.isError}
          retry={() => void orgs.refetch()}
          to="/admin/orgs"
          empty="No applications waiting. New organizations show up here."
        >
          {waitingOrgs.slice(0, 4).map((o) => (
            <QueueRow
              key={o.id}
              image={o.image ?? ""}
              title={o.name}
              meta={
                <span className="flex items-center gap-2">
                  Applied {o.submittedAt ? timeAgo(o.submittedAt) : "date unavailable"}
                  <span aria-hidden className="hidden sm:inline">
                    ·
                  </span>
                  <CheckMeter passed={o.checks} />
                </span>
              }
              to="/admin/orgs/$id"
              id={o.id}
            />
          ))}
        </Queue>
        <Queue
          title="Campaigns to review"
          count={campaigns.data?.total}
          loading={campaigns.isPending}
          error={campaigns.isError}
          retry={() => void campaigns.refetch()}
          to="/admin/campaigns"
          empty="Nothing to review. New campaigns show up here."
        >
          {waitingCampaigns.slice(0, 4).map((c) => (
            <QueueRow
              key={c.id}
              image={c.image ?? ""}
              title={c.name}
              meta={`${c.detail}, submitted ${c.submittedAt ? timeAgo(c.submittedAt) : "date unavailable"}`}
              to="/admin/campaigns/$id"
              id={c.id}
            />
          ))}
        </Queue>
      </div>

      <section aria-label="Giving analytics" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[15px] font-semibold text-ink">Giving</h2>
          <Segmented
            value={range}
            onChange={setRange}
            items={[
              { value: "7d", label: "Last 7 days" },
              { value: "30d", label: "Last 30 days" },
            ]}
          />
        </div>
        {analytics.isError ? (
          <AdminLoadError
            message="Could not load giving analytics."
            retry={() => void analytics.refetch()}
          />
        ) : analytics.isPending ? (
          <div role="status" className="rounded-card border border-line-soft p-6">
            <Bone className="h-60 w-full" />
            <span className="sr-only">Loading giving analytics</span>
          </div>
        ) : (
          <>
            <dl className="grid grid-cols-2 overflow-hidden rounded-card border border-line-soft lg:grid-cols-4">
              {strip.map((s, i) => (
                <div
                  key={s.label}
                  className={cn(
                    "flex min-w-0 flex-col gap-2 p-4 sm:p-5",
                    i % 2 === 1 && "border-l border-line-soft",
                    i >= 2 && "border-t border-line-soft lg:border-t-0",
                    i === 2 && "lg:border-l",
                  )}
                >
                  <dt className="text-[13px] text-muted-ink">{s.label}</dt>
                  <dd className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
                    <span className="font-display text-[22px] leading-none tracking-[-0.02em] text-ink sm:text-[26px]">
                      {s.value}
                    </span>
                    {s.delta ? (
                      <span
                        className={cn(
                          "rounded-[6px] px-1.5 py-0.5 text-[12px] font-medium",
                          s.up ? "bg-verified/10 text-verified-ink" : "bg-danger/10 text-danger",
                        )}
                      >
                        {s.up ? "+" : "−"}
                        {s.delta}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="rounded-card border border-line-soft p-5 sm:p-6">
              <div className="flex items-baseline justify-between gap-4 pb-2">
                <p className="text-sm font-medium text-ink">
                  {range === "7d" ? "Gifts each day" : "Gifts each week"}
                </p>
                <button
                  type="button"
                  aria-label="Open giving report and export"
                  title="View reporting details and export"
                  onClick={() => setReportOpen(true)}
                  className="text-[13px] text-muted-ink"
                >
                  {formatMoney(series.reduce((n, d) => n + d.value, 0))} in total
                </button>
              </div>
              <AdminColumnChart
                key={range}
                data={series}
                format={formatCompactMoney}
                label={
                  range === "7d"
                    ? "Naira given each day in the selected period (UTC)"
                    : "Naira given each week in the selected period (UTC)"
                }
              />
            </div>
          </>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-ink">Recent activity</h2>
          <Link
            to="/admin/activity"
            className="inline-flex items-center gap-1 text-sm text-muted-ink transition-colors hover:text-ink"
          >
            View all <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>
        <div className="rounded-card border border-line-soft p-5 sm:p-6">
          {activity.isError ? (
            <AdminLoadError
              message="Could not load recent activity."
              retry={() => void activity.refetch()}
            />
          ) : activity.isPending ? (
            <p role="status">Loading recent activity...</p>
          ) : (
            <Timeline entries={activity.data?.items ?? []} showTarget />
          )}
        </div>
      </section>
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-h-[85dvh] max-w-[800px] overflow-y-auto">
          <DialogTitle>Giving reports and export</DialogTitle>
          <DialogDescription>
            Actual successful gifts, platform totals and growth metrics for the selected period.
          </DialogDescription>
          <p className="mt-3">
            Successful gifts only, excluding tips and fees. Dates use UTC. Organization totals count
            submissions. The 30-day chart includes partial weeks.
          </p>
          <div className="mt-4 rounded-field border border-line-soft p-4">
            <h3 className="text-sm font-semibold text-ink">Platform totals</h3>
            {totals.isError ? (
              <AdminLoadError
                message="Could not load platform totals."
                retry={() => void totals.refetch()}
              />
            ) : !totals.data ? (
              <p role="status">Loading totals...</p>
            ) : (
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Total users", value: totals.data.totalUsers.toLocaleString() },
                  {
                    label: "Organizations",
                    value: totals.data.totalOrganizations.toLocaleString(),
                  },
                  {
                    label: "Verified organizations",
                    value: totals.data.verifiedOrganizations.toLocaleString(),
                  },
                  {
                    label: "Approved campaigns",
                    value: totals.data.activeCampaigns.toLocaleString(),
                  },
                  {
                    label: "Donations received this month",
                    value: formatMoney(totals.data.totalRaised),
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs text-muted-ink">{item.label}</dt>
                    <dd className="mt-1 text-sm font-medium text-ink">{item.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <label className="mt-4 flex flex-col gap-2">
            Report metric
            <select
              aria-label="Report metric"
              value={reportMetric}
              onChange={(e) => setReportMetric(e.target.value as keyof AnalyticsTotals)}
              className="rounded-field border border-line-input bg-paper p-2 text-ink"
            >
              <option value="given">Donation volume</option>
              <option value="gifts">Successful gifts</option>
              <option value="users">New users</option>
              <option value="organizations">Organization submissions</option>
              <option value="campaigns">Campaign submissions</option>
            </select>
          </label>
          {analytics.data && (
            <div className="my-4">
              <AdminColumnChart
                data={overviewSeries(analytics.data, reportMetric)}
                label="Selected reporting metric (UTC)"
                format={reportMetric === "given" ? formatCompactMoney : (n) => n.toLocaleString()}
              />
            </div>
          )}
          <button
            disabled={!analytics.data || analytics.isFetching}
            className={btn("secondary", "sm")}
            onClick={() => {
              if (analytics.data)
                downloadAdminCsv("azarfaith-analytics-" + range + ".csv", [
                  [
                    "Date (UTC)",
                    "Given (NGN)",
                    "Successful gifts",
                    "New users",
                    "Organization submissions",
                    "Campaign submissions",
                  ],
                  ...analytics.data.series.map((r) => [
                    r.date,
                    r.given,
                    r.gifts,
                    r.users,
                    r.organizations,
                    r.campaigns,
                  ]),
                ]);
            }}
          >
            Export report
          </button>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

function Queue({
  title,
  count,
  to,
  empty,
  children,
  loading,
  error,
  retry,
}: {
  title: string;
  count?: number;
  loading: boolean;
  error: boolean;
  retry: () => void;
  to: string;
  empty: string;
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col rounded-card border border-line-soft">
      <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3.5 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          {title}
          <span
            className={cn(
              "rounded-[6px] px-1.5 text-[12px] font-medium tabular-nums",
              count ? "bg-brand/10 text-brand-ink" : "bg-panel text-muted-ink",
            )}
          >
            {count ?? "…"}
          </span>
        </h2>
        <Link
          to={to as "/admin/orgs"}
          search={{ view: "pending" } as never}
          className="inline-flex items-center gap-1 text-[13px] text-muted-ink transition-colors hover:text-ink"
        >
          <span className="hidden sm:inline">Open queue</span>
          <span className="sm:hidden">All</span>{" "}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>
      {error ? (
        <div className="p-4">
          <AdminLoadError message="Could not load this review queue." retry={retry} />
        </div>
      ) : loading ? (
        <div role="status" className="p-5">
          <Bone className="h-20 w-full" />
          <span className="sr-only">Loading queue</span>
        </div>
      ) : count === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 py-10 text-center">
          <CheckCircle2 className="h-5 w-5 text-verified" strokeWidth={1.75} />
          <p className="max-w-[260px] text-sm text-muted-ink">{empty}</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-line-soft">{children}</ul>
      )}
    </section>
  );
}

function QueueRow({
  image,
  title,
  meta,
  to,
  id,
}: {
  image: string;
  title: string;
  meta: ReactNode;
  to: string;
  id: string;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <Photo src={image} alt="" className="h-9 w-9 shrink-0 rounded-[8px] object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{title}</p>
        <div className="truncate text-[12px] text-muted-ink">{meta}</div>
      </div>
      <Link to={to as "/admin/orgs/$id"} params={{ id }} className={btn("secondary", "sm")}>
        <BadgeCheck className="hidden h-3.5 w-3.5 sm:block" strokeWidth={2} /> Review
      </Link>
    </li>
  );
}
