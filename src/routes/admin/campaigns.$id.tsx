import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Clock,
  MapPin,
  Calendar,
  Users,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "@/lib/admin-store";
import { formatMoney } from "@/lib/admin-mock";
import { AdminPageWrapper } from "@/components/admin/AdminLayout";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminRejectDialog } from "@/components/admin/AdminRejectDialog";
import { StatusBadge, AdminBadge } from "@/components/admin/AdminBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/campaigns/$id")({
  component: AdminCampaignDetail,
});

function AdminCampaignDetail() {
  const { id } = Route.useParams();
  const { campaigns, orgs, moderateCampaign } = useApp();
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);

  const campaign = campaigns.find((c) => c.id === id);

  if (!campaign) {
    return (
      <AdminPageWrapper title="Campaign Not Found">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-gray-500">Campaign not found.</p>
          <Link to="/admin/campaigns">
            <Button variant="ghost" className="mt-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Campaigns
            </Button>
          </Link>
        </div>
      </AdminPageWrapper>
    );
  }

  const org = campaign.orgId ? orgs.find((o) => o.id === campaign.orgId) : null;
  const progress = campaign.goal ? Math.min((campaign.raised / campaign.goal) * 100, 100) : 0;

  return (
    <AdminPageWrapper title={campaign.title}>
      <div className="space-y-6">
        <Link
          to="/admin/campaigns"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-bold text-gray-900">{campaign.title}</h2>
              <StatusBadge status={campaign.verificationStatus} />
              <AdminBadge variant={campaign.urgency}>
                {campaign.urgency === "critical" && <AlertTriangle className="h-3 w-3" />}
                {campaign.urgency.charAt(0).toUpperCase() + campaign.urgency.slice(1)}
              </AdminBadge>
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {campaign.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Created {campaign.createdAt}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {campaign.verificationStatus === "pending" && (
              <>
                <Button
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setApproveDialog(true)}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => setRejectDialog(true)}
                >
                  <ShieldAlert className="h-4 w-4" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <img src={campaign.cover} alt={campaign.title} className="h-64 w-full object-cover" />
              <div className="p-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Story</h3>
                <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                  {campaign.story}
                </p>
              </div>
            </div>

            {campaign.gallery.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Gallery</h3>
                <div className="grid grid-cols-3 gap-3">
                  {campaign.gallery.map((photo, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-lg">
                      <img
                        src={photo}
                        alt={`Photo ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {campaign.updates.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">
                  Updates ({campaign.updates.length})
                </h3>
                <div className="space-y-4">
                  {campaign.updates.map((update) => (
                    <div key={update.id} className="border-l-2 border-amber-400 pl-4">
                      <p className="text-xs text-gray-400">{update.date}</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">{update.title}</p>
                      <p className="mt-1 text-sm text-gray-600">{update.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {campaign.comments.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">
                  Comments ({campaign.comments.length})
                </h3>
                <div className="space-y-4">
                  {campaign.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <img
                        src={comment.avatar}
                        alt={comment.author}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{comment.author}</p>
                          <p className="text-xs text-gray-400">{comment.date}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{comment.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Campaign Stats</h3>
              {campaign.goal && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium text-gray-900">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-4">
                {campaign.goal && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Goal</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatMoney(campaign.goal)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Raised</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatMoney(campaign.raised)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Donors</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {campaign.donors.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Urgency</span>
                  <AdminBadge variant={campaign.urgency}>
                    {campaign.urgency.charAt(0).toUpperCase() + campaign.urgency.slice(1)}
                  </AdminBadge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Mode</span>
                  <AdminBadge variant={campaign.mode === "ongoing" ? "ongoing" : "one-time"}>
                    {campaign.mode === "ongoing" ? "Ongoing" : "One-Time"}
                  </AdminBadge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Type</span>
                  <AdminBadge
                    variant={
                      campaign.type as "money" | "item" | "volunteer" | "professional" | "emergency"
                    }
                  >
                    {campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1)}
                  </AdminBadge>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Raiser</h3>
              <div className="flex items-center gap-3">
                <img
                  src={campaign.raiser.avatar}
                  alt={campaign.raiser.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{campaign.raiser.name}</p>
                  <p className="text-xs text-gray-500">{campaign.raiser.location}</p>
                </div>
              </div>
              {org && (
                <Link
                  to="/admin/orgs/$id"
                  params={{ id: org.id }}
                  className="mt-3 flex items-center gap-2 rounded-lg border border-gray-100 p-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <img
                    src={org.photos[0]}
                    alt={org.name}
                    className="h-6 w-6 rounded object-cover"
                  />
                  {org.name}
                  <StatusBadge status={org.verificationStatus} />
                </Link>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Moderation</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <StatusBadge status={campaign.verificationStatus} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Category</span>
                  <span className="text-sm text-gray-700">{campaign.faithCategory}</span>
                </div>
              </div>
            </div>

            {campaign.donations.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Recent Donations</h3>
                <div className="space-y-3">
                  {campaign.donations.slice(0, 5).map((d) => (
                    <div key={d.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{d.donor}</p>
                        <p className="text-xs text-gray-400">{d.date}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatMoney(d.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AdminConfirmDialog
        open={approveDialog}
        onOpenChange={setApproveDialog}
        title="Approve Campaign"
        description={`Are you sure you want to approve "${campaign.title}"? It will become visible to all donors.`}
        confirmLabel="Approve Campaign"
        onConfirm={() => {
          moderateCampaign(campaign.id, "verified");
          toast.success("Campaign approved and published");
        }}
      />

      <AdminRejectDialog
        open={rejectDialog}
        onOpenChange={setRejectDialog}
        title={`Reject "${campaign.title}"`}
        onReject={(reason) => {
          moderateCampaign(campaign.id, "rejected", reason);
          toast.error("Campaign rejected");
        }}
      />
    </AdminPageWrapper>
  );
}
