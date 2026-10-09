import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, CheckCircle2, Megaphone } from "lucide-react";
import { useApp } from "@/lib/store";
import { formatCompactMoney, formatMoney } from "@/lib/mock";
import { pending, simulateNetwork } from "@/lib/api";
import { AdminCard, AdminPage } from "@/components/admin/AdminLayout";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminColumnChart } from "@/components/admin/AdminBarChart";
import { AdminActivityFeed } from "@/components/admin/AdminActivityFeed";
import { AdminDashboardSkeleton } from "@/components/admin/AdminSkeletons";
import { StatusBadge } from "@/components/admin/AdminBadge";

export const Route = createFileRoute("/admin/")({
  loader: () => simulateNetwork(),
  pendingComponent: AdminDashboardSkeleton,
  ...pending,
  head: () => ({ meta: [{ title: "Overview — AzarFaith admin" }] }),
  component: AdminOverview,
});

const giftsThisWeek = [
  { label: "Mon", value: 245000 },
  { label: "Tue", value: 180000 },
  { label: "Wed", value: 320000 },
  { label: "Thu", value: 195000 },
  { label: "Fri", value: 410000 },
  { label: "Sat", value: 280000 },
  { label: "Sun", value: 150000 },
];

function AdminOverview() {
  const users = useApp((s) => s.users);
  const orgs = useApp((s) => s.orgs);
  const campaigns = useApp((s) => s.campaigns);

  const pendingOrgs = orgs.filter((o) => o.verificationStatus === "pending").length;
  const verifiedOrgs = orgs.filter((o) => o.verificationStatus === "verified").length;
  const byStatus = (s: string) => campaigns.filter((c) => c.verificationStatus === s).length;
  const pendingCampaigns = byStatus("pending");
  const liveCampaigns = byStatus("verified");
  const totalRaised = campaigns.reduce((sum, c) => sum + c.raised, 0);
  const weekTotal = giftsThisWeek.reduce((sum, d) => sum + d.value, 0);
  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const queue = [
    pendingOrgs > 0 && {
      icon: Building2,
      text: `${pendingOrgs} organization${pendingOrgs > 1 ? "s" : ""} waiting for verification`,
      to: "/admin/orgs",
    },
    pendingCampaigns > 0 && {
      icon: Megaphone,
      text: `${pendingCampaigns} campaign${pendingCampaigns > 1 ? "s" : ""} waiting for review`,
      to: "/admin/campaigns",
    },
  ].filter(Boolean) as { icon: typeof Building2; text: string; to: string }[];

  const statuses = [
    { status: "verified" as const, count: liveCampaigns },
    { status: "pending" as const, count: pendingCampaigns },
    { status: "unverified" as const, count: byStatus("unverified") },
    { status: "rejected" as const, count: byStatus("rejected") },
  ].filter((s) => s.count > 0);

  return (
    <AdminPage title="Overview" lead={today}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Users"
          value={users.length.toString()}
          delta={{ text: "3 joined this week", tone: "up" }}
          to="/admin/users"
        />
        <AdminStatCard
          label="Verified organizations"
          value={`${verifiedOrgs} of ${orgs.length}`}
          delta={
            pendingOrgs > 0
              ? { text: `${pendingOrgs} waiting for review`, tone: "neutral" }
              : undefined
          }
          to="/admin/orgs"
        />
        <AdminStatCard
          label="Live campaigns"
          value={liveCampaigns.toString()}
          delta={
            pendingCampaigns > 0
              ? { text: `${pendingCampaigns} waiting for review`, tone: "neutral" }
              : undefined
          }
          to="/admin/campaigns"
        />
        <AdminStatCard
          label="Given this month"
          value={formatMoney(totalRaised)}
          delta={{ text: "18% more than last month", tone: "up" }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <AdminCard
          title="Gifts this week"
          action={<span className="text-sm text-muted-ink">{formatMoney(weekTotal)} in total</span>}
          className="lg:col-span-2"
        >
          <AdminColumnChart
            data={giftsThisWeek}
            format={formatCompactMoney}
            label="Gifts received each day this week, in naira"
          />
        </AdminCard>

        <AdminCard title="Needs your attention">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle2 className="h-6 w-6 text-verified" strokeWidth={1.75} />
              <p className="text-sm text-ink-soft">Nothing is waiting. You're up to date.</p>
            </div>
          ) : (
            <ul className="-mx-2 flex flex-col">
              {queue.map((q) => (
                <li key={q.to}>
                  <Link
                    to={q.to as "/admin"}
                    className="group flex items-center gap-3 rounded-field px-2 py-3 transition-colors hover:bg-panel"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/10 text-brand-ink">
                      <q.icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-medium text-ink">{q.text}</span>
                    <ArrowRight
                      className="h-4 w-4 text-muted-ink transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink"
                      strokeWidth={2}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <AdminCard title="Campaigns by status">
          <ul className="flex flex-col gap-4">
            {statuses.map((s) => {
              const share = Math.round((s.count / campaigns.length) * 100);
              return (
                <li key={s.status} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={s.status} />
                    <span className="text-sm text-ink-soft">
                      <span className="font-semibold text-ink">{s.count}</span> ({share}%)
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-line-soft">
                    <div
                      className="h-full rounded-full bg-ink transition-[width] duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </AdminCard>

        <AdminCard title="Recent activity" className="lg:col-span-2">
          <AdminActivityFeed />
        </AdminCard>
      </div>
    </AdminPage>
  );
}
