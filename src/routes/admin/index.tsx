import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Building2, Megaphone, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getAdminDashboard } from "@/features/catalog/api";
import { formatMoney } from "@/lib/catalog";
import { AdminPageWrapper } from "@/components/admin/AdminLayout";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminBarChart } from "@/components/admin/AdminBarChart";
import { AdminActivityFeed } from "@/components/admin/AdminActivityFeed";
import { PageSpinner } from "@/components/PageSpinner";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getAdminDashboard,
  });

  if (!data) {
    return (
      <AdminPageWrapper title="Dashboard">
        {isLoading ? (
          <PageSpinner label="Loading admin dashboard..." fullScreen={false} />
        ) : (
          <p className="text-sm text-muted-foreground">Could not load dashboard.</p>
        )}
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper title="Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard
            label="Total Users"
            value={data.totalUsers.toString()}
            icon={<Users className="h-5 w-5" />}
          />
          <AdminStatCard
            label="Verified Orgs"
            value={`${data.verifiedOrganizations} / ${data.totalOrganizations}`}
            icon={<Building2 className="h-5 w-5" />}
            trend={
              data.pendingOrganizations > 0
                ? { value: `${data.pendingOrganizations} pending`, positive: false }
                : undefined
            }
          />
          <AdminStatCard
            label="Active Campaigns"
            value={data.activeCampaigns.toString()}
            icon={<Megaphone className="h-5 w-5" />}
            trend={
              data.pendingCampaigns > 0
                ? { value: `${data.pendingCampaigns} pending review`, positive: false }
                : undefined
            }
          />
          <AdminStatCard
            label="Total Raised (MTD)"
            value={formatMoney(data.totalRaised)}
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Donations This Week</h3>
            <AdminBarChart data={data.donationChart} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Campaign Status</h3>
            <AdminBarChart data={data.campaignStatusChart} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Pending Actions</h3>
            </div>
            <div className="space-y-3">
              {data.pendingOrganizations > 0 && (
                <Link
                  to="/admin/orgs"
                  className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 transition-colors hover:bg-amber-100"
                >
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      {data.pendingOrganizations} organization{data.pendingOrganizations > 1 ? "s" : ""} awaiting verification
                    </p>
                    <p className="text-xs text-amber-600">Review and verify organizations</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-amber-600" />
                </Link>
              )}
              {data.pendingCampaigns > 0 && (
                <Link
                  to="/admin/campaigns"
                  className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 transition-colors hover:bg-amber-100"
                >
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      {data.pendingCampaigns} campaign{data.pendingCampaigns > 1 ? "s" : ""} pending
                      moderation
                    </p>
                    <p className="text-xs text-amber-600">Review and approve campaigns</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-amber-600" />
                </Link>
              )}
              {data.pendingOrganizations === 0 && data.pendingCampaigns === 0 && (
                <p className="py-6 text-center text-sm text-gray-500">
                  No pending actions. All caught up!
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <AdminActivityFeed items={data.recentActivity} />
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  );
}
