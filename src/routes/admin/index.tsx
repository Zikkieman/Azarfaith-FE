import { createFileRoute } from "@tanstack/react-router";
import { Users, Building2, Megaphone, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useApp } from "@/lib/admin-store";
import { formatMoney } from "@/lib/admin-mock";
import { AdminPageWrapper } from "@/components/admin/AdminLayout";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminBarChart } from "@/components/admin/AdminBarChart";
import { AdminActivityFeed } from "@/components/admin/AdminActivityFeed";
import { StatusBadge } from "@/components/admin/AdminBadge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { users, orgs, campaigns } = useApp();

  const pendingOrgs = orgs.filter((o) => o.verificationStatus === "pending").length;
  const pendingCampaigns = campaigns.filter((c) => c.verificationStatus === "pending").length;
  const activeCampaigns = campaigns.filter((c) => c.verificationStatus === "verified").length;
  const totalRaised = campaigns.reduce((sum, c) => sum + c.raised, 0);

  const donationData = [
    { label: "Mon", value: 245000 },
    { label: "Tue", value: 180000 },
    { label: "Wed", value: 320000 },
    { label: "Thu", value: 195000 },
    { label: "Fri", value: 410000 },
    { label: "Sat", value: 280000 },
    { label: "Sun", value: 150000 },
  ];

  const campaignStatusData = [
    { label: "Verified", value: activeCampaigns },
    { label: "Pending", value: pendingCampaigns },
    {
      label: "Unverified",
      value: campaigns.filter((c) => c.verificationStatus === "unverified").length,
    },
  ];

  return (
    <AdminPageWrapper title="Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard
            label="Total Users"
            value={users.length.toString()}
            icon={<Users className="h-5 w-5" />}
            trend={{ value: "+3 this week", positive: true }}
          />
          <AdminStatCard
            label="Verified Orgs"
            value={`${orgs.filter((o) => o.verificationStatus === "verified").length} / ${orgs.length}`}
            icon={<Building2 className="h-5 w-5" />}
            trend={
              pendingOrgs > 0 ? { value: `${pendingOrgs} pending`, positive: false } : undefined
            }
          />
          <AdminStatCard
            label="Active Campaigns"
            value={activeCampaigns.toString()}
            icon={<Megaphone className="h-5 w-5" />}
            trend={
              pendingCampaigns > 0
                ? { value: `${pendingCampaigns} pending review`, positive: false }
                : undefined
            }
          />
          <AdminStatCard
            label="Total Raised (MTD)"
            value={formatMoney(totalRaised)}
            icon={<TrendingUp className="h-5 w-5" />}
            trend={{ value: "+18% vs last month", positive: true }}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Donations This Week</h3>
            <AdminBarChart data={donationData} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Campaign Status</h3>
            <AdminBarChart data={campaignStatusData} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Pending Actions</h3>
            </div>
            <div className="space-y-3">
              {pendingOrgs > 0 && (
                <Link
                  to="/admin/orgs"
                  className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 transition-colors hover:bg-amber-100"
                >
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      {pendingOrgs} organization{pendingOrgs > 1 ? "s" : ""} awaiting verification
                    </p>
                    <p className="text-xs text-amber-600">Review and verify organizations</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-amber-600" />
                </Link>
              )}
              {pendingCampaigns > 0 && (
                <Link
                  to="/admin/campaigns"
                  className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 transition-colors hover:bg-amber-100"
                >
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      {pendingCampaigns} campaign{pendingCampaigns > 1 ? "s" : ""} pending
                      moderation
                    </p>
                    <p className="text-xs text-amber-600">Review and approve campaigns</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-amber-600" />
                </Link>
              )}
              {pendingOrgs === 0 && pendingCampaigns === 0 && (
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
            <AdminActivityFeed />
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  );
}
