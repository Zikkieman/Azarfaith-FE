import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, CheckCircle2 } from "lucide-react";
import { type AuditAction, timeAgo } from "@/lib/admin";
import { apiFetch, pending } from "@/lib/api";
import { btn } from "@/components/app/btn";
import { AdminPage } from "@/components/admin/AdminLayout";
import { AdminColumnChart } from "@/components/admin/AdminBarChart";
import { AdminDashboardSkeleton } from "@/components/admin/AdminSkeletons";
import { Timeline } from "@/components/admin/AdminParts";
import { Segmented } from "@/components/admin/AdminFilterBar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/")({
  pendingComponent: AdminDashboardSkeleton,
  ...pending,
  head: () => ({ meta: [{ title: "Overview — AzarFaith admin" }] }),
  component: AdminOverview,
});

type Range = "7d" | "30d";
type OrganizationQueueItem = { id: string; name: string; category: string; photos: string[]; createdAt: string };
type CampaignQueueItem = { id: string; title: string; cover: string; createdAt: string; raiser: { name: string } };
type Dashboard = { recentActivity: Array<{ id: string; type: string; title: string; description: string; createdAt: string; link: string }> };
type Analytics = {
  current: { given: number; gifts: number; users: number; organizations: number };
  change: Partial<Record<"given" | "gifts" | "users" | "organizations", number | null>>;
  series: Array<{ date: string; given: number }>;
};
const formatMoney = (amount: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
const formatCompactMoney = (amount: number) => new Intl.NumberFormat("en-NG", { notation: "compact", style: "currency", currency: "NGN", maximumFractionDigits: 1 }).format(amount);
const activityAction = (type: string): AuditAction => ({ org_registered: "org_registered", campaign_submitted: "campaign_submitted" }[type] as AuditAction | undefined) ?? "settings_updated";

function AdminOverview() {
  const { user } = useAuth();
  const [range, setRange] = useState<Range>("7d");
  const organizations = useQuery({ queryKey: ["admin", "organizations", "pending"], queryFn: () => apiFetch<OrganizationQueueItem[]>("/admin/review/organizations?status=PENDING") });
  const campaigns = useQuery({ queryKey: ["admin", "campaigns", "pending"], queryFn: () => apiFetch<CampaignQueueItem[]>("/admin/review/campaigns?status=PENDING") });
  const dashboard = useQuery({ queryKey: ["admin", "dashboard"], queryFn: () => apiFetch<Dashboard>("/admin/review/dashboard") });
  const analytics = useQuery({ queryKey: ["admin", "analytics", range], queryFn: () => apiFetch<Analytics>(`/admin/review/analytics?range=${range}`) });
  if (organizations.isLoading || campaigns.isLoading || dashboard.isLoading || analytics.isLoading) return <AdminDashboardSkeleton />;
  if (organizations.error) throw organizations.error;
  if (campaigns.error) throw campaigns.error;
  if (dashboard.error) throw dashboard.error;
  if (analytics.error) throw analytics.error;
  const waitingOrgs = organizations.data ?? [];
  const waitingCampaigns = campaigns.data ?? [];
  const current = analytics.data?.current ?? { given: 0, gifts: 0, users: 0, organizations: 0 };
  const changes = analytics.data?.change ?? {};
  const series = (analytics.data?.series ?? []).map((item) => ({ label: new Date(`${item.date}T00:00:00Z`).toLocaleDateString("en-NG", { weekday: range === "7d" ? "short" : undefined, day: range === "30d" ? "numeric" : undefined, month: range === "30d" ? "short" : undefined }), value: item.given }));
  const strip = [
    { label: "Given", value: formatMoney(current.given), delta: changes.given },
    { label: "Gifts", value: current.gifts.toLocaleString(), delta: changes.gifts },
    { label: "New givers", value: current.users.toLocaleString(), delta: changes.users },
    { label: "New organizations", value: current.organizations.toLocaleString(), delta: changes.organizations },
  ];
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
      title={`${greeting}, ${user?.fullName.split(" ")[0] ?? "Administrator"}`}
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
              meta={`Applied ${timeAgo(o.createdAt)} · ${o.category}`}
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
                {s.delta !== null && s.delta !== undefined ? (
                  <span
                    className={cn(
                      "rounded-[6px] px-1.5 py-0.5 text-[12px] font-medium",
                      s.delta >= 0 ? "bg-verified/10 text-verified-ink" : "bg-danger/10 text-danger",
                    )}
                  >
                    {s.delta >= 0 ? "+" : "−"}
                    {Math.abs(s.delta)}%
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
        <div className="rounded-card border border-line-soft p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-4 pb-2">
            <p className="text-sm font-medium text-ink">
              Gifts each day
            </p>
            <p className="text-[13px] text-muted-ink">
              {formatMoney(series.reduce((n, d) => n + d.value, 0))} in total
            </p>
          </div>
          <AdminColumnChart
            key={range}
            data={series}
            format={formatCompactMoney}
            label={
              range === "7d" ? "Naira given each day this week" : "Naira given each day this month"
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
          <Timeline entries={(dashboard.data?.recentActivity ?? []).slice(0, 6).map((entry) => ({
            id: entry.id,
            actor: "AzarFaith",
            action: activityAction(entry.type),
            target: { kind: entry.type === "org_registered" ? "org" : entry.type === "campaign_submitted" ? "campaign" : "platform", name: entry.title },
            detail: entry.description,
            at: entry.createdAt,
          }))} showTarget />
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
            {count}
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
  image?: string;
  title: string;
  meta: ReactNode;
  to: string;
  id: string;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:px-5">
      {image ? <img src={image} alt="" className="h-9 w-9 shrink-0 rounded-[8px] object-cover" /> : <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-panel text-[12px] font-semibold text-muted-ink">{title.slice(0, 1).toUpperCase()}</span>}
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
