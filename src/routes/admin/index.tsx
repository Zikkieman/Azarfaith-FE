import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, CheckCircle2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { formatCompactMoney, formatMoney } from "@/lib/mock";
import { orgFiles, timeAgo } from "@/lib/admin";
import { pending, simulateNetwork } from "@/lib/api";
import { btn } from "@/components/app/btn";
import { AdminPage } from "@/components/admin/AdminLayout";
import { AdminColumnChart } from "@/components/admin/AdminBarChart";
import { AdminDashboardSkeleton } from "@/components/admin/AdminSkeletons";
import { CheckMeter, Timeline } from "@/components/admin/AdminParts";
import { Segmented } from "@/components/admin/AdminFilterBar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  loader: () => simulateNetwork(),
  pendingComponent: AdminDashboardSkeleton,
  ...pending,
  head: () => ({ meta: [{ title: "Overview — AzarFaith admin" }] }),
  component: AdminOverview,
});

type Range = "7d" | "30d";

const series: Record<Range, { label: string; value: number }[]> = {
  "7d": [
    { label: "Mon", value: 245000 },
    { label: "Tue", value: 180000 },
    { label: "Wed", value: 320000 },
    { label: "Thu", value: 195000 },
    { label: "Fri", value: 410000 },
    { label: "Sat", value: 280000 },
    { label: "Sun", value: 150000 },
  ],
  "30d": [
    { label: "Sep 12", value: 1420000 },
    { label: "Sep 19", value: 1690000 },
    { label: "Sep 26", value: 1310000 },
    { label: "Oct 3", value: 1780000 },
  ],
};

const strip: Record<Range, { label: string; value: string; delta?: string; up?: boolean }[]> = {
  "7d": [
    { label: "Given", value: "₦1,780,000", delta: "12%", up: true },
    { label: "Gifts", value: "214", delta: "8%", up: true },
    { label: "New givers", value: "3" },
    { label: "New organizations", value: "1" },
  ],
  "30d": [
    { label: "Given", value: "₦6,200,000", delta: "18%", up: true },
    { label: "Gifts", value: "903", delta: "4%", up: false },
    { label: "New givers", value: "11" },
    { label: "New organizations", value: "2" },
  ],
};

function AdminOverview() {
  const orgs = useApp((s) => s.orgs);
  const campaigns = useApp((s) => s.campaigns);
  const log = useApp((s) => s.auditLog);
  const [range, setRange] = useState<Range>("7d");

  const waitingOrgs = orgs.filter((o) => o.verificationStatus === "pending");
  const waitingCampaigns = campaigns.filter((c) => c.verificationStatus === "pending");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const waiting = waitingOrgs.length + waitingCampaigns.length;

  return (
    <AdminPage
      title={`${greeting}, Tunde`}
      lead={
        <>
          {today}.{" "}
          {waiting
            ? `${waiting} thing${waiting > 1 ? "s are" : " is"} waiting for you.`
            : "Nothing is waiting for you."}
        </>
      }
      crumbs={[{ label: "Overview" }]}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Queue
          title="Organizations to verify"
          count={waitingOrgs.length}
          to="/admin/orgs"
          empty="No applications waiting. New organizations show up here."
        >
          {waitingOrgs.slice(0, 4).map((o) => (
            <QueueRow
              key={o.id}
              image={o.photos[0]}
              title={o.name}
              meta={
                <span className="flex items-center gap-2">
                  Applied {orgFiles[o.id] ? timeAgo(orgFiles[o.id].submittedAt) : "recently"}
                  <span aria-hidden>·</span>
                  <CheckMeter orgId={o.id} />
                </span>
              }
              to="/admin/orgs/$id"
              id={o.id}
            />
          ))}
        </Queue>
        <Queue
          title="Campaigns to review"
          count={waitingCampaigns.length}
          to="/admin/campaigns"
          empty="Nothing to review. New campaigns show up here."
        >
          {waitingCampaigns.slice(0, 4).map((c) => (
            <QueueRow
              key={c.id}
              image={c.cover}
              title={c.title}
              meta={`${c.raiser.name}, submitted ${timeAgo(c.createdAt)}`}
              to="/admin/campaigns/$id"
              id={c.id}
            />
          ))}
        </Queue>
      </div>

      <section className="flex flex-col gap-4">
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
        <dl className="grid grid-cols-2 overflow-hidden rounded-card border border-line-soft lg:grid-cols-4">
          {strip[range].map((s, i) => (
            <div
              key={s.label}
              className={cn(
                "flex flex-col gap-2 p-5",
                i % 2 === 1 && "border-l border-line-soft",
                i >= 2 && "border-t border-line-soft lg:border-t-0",
                i === 2 && "lg:border-l",
              )}
            >
              <dt className="text-[13px] text-muted-ink">{s.label}</dt>
              <dd className="flex items-baseline gap-2">
                <span className="font-display text-[26px] leading-none tracking-[-0.02em] text-ink">
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
            <p className="text-[13px] text-muted-ink">
              {formatMoney(series[range].reduce((n, d) => n + d.value, 0))} in total
            </p>
          </div>
          <AdminColumnChart
            key={range}
            data={series[range]}
            format={formatCompactMoney}
            label={
              range === "7d" ? "Naira given each day this week" : "Naira given each week this month"
            }
          />
        </div>
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
          <Timeline entries={log.slice(0, 6)} showTarget />
        </div>
      </section>
    </AdminPage>
  );
}

function Queue({
  title,
  count,
  to,
  empty,
  children,
}: {
  title: string;
  count: number;
  to: string;
  empty: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-card border border-line-soft">
      <div className="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-3.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          {title}
          <span
            className={cn(
              "rounded-[6px] px-1.5 text-[12px] font-medium tabular-nums",
              count ? "bg-brand/10 text-brand-ink" : "bg-panel text-muted-ink",
            )}
          >
            {count}
          </span>
        </h2>
        <Link
          to={to as "/admin/orgs"}
          search={{ view: "pending" } as never}
          className="inline-flex items-center gap-1 text-[13px] text-muted-ink transition-colors hover:text-ink"
        >
          Open queue <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>
      {count === 0 ? (
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
    <li className="flex items-center gap-3 px-5 py-3">
      <img src={image} alt="" className="h-9 w-9 shrink-0 rounded-[8px] object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{title}</p>
        <div className="truncate text-[12px] text-muted-ink">{meta}</div>
      </div>
      <Link to={to as "/admin/orgs/$id"} params={{ id }} className={btn("secondary", "sm")}>
        <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} /> Review
      </Link>
    </li>
  );
}
