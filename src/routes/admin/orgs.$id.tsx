import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Clock,
  MapPin,
  Calendar,
  Users,
  Megaphone,
} from "lucide-react";
import { useApp } from "@/lib/admin-store";
import { formatMoney } from "@/lib/admin-mock";
import { AdminPageWrapper } from "@/components/admin/AdminLayout";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminRejectDialog } from "@/components/admin/AdminRejectDialog";
import { StatusBadge, AdminBadge } from "@/components/admin/AdminBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orgs/$id")({
  component: AdminOrgDetail,
});

function AdminOrgDetail() {
  const { id } = Route.useParams();
  const { orgs, campaigns, verifyOrg } = useApp();
  const navigate = useNavigate();
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);

  const org = orgs.find((o) => o.id === id);

  if (!org) {
    return (
      <AdminPageWrapper title="Organization Not Found">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-gray-500">Organization not found.</p>
          <Link to="/admin/orgs">
            <Button variant="ghost" className="mt-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Organizations
            </Button>
          </Link>
        </div>
      </AdminPageWrapper>
    );
  }

  const orgCampaigns = campaigns.filter((c) => c.orgId === org.id);

  return (
    <AdminPageWrapper title={org.name}>
      <div className="space-y-6">
        <Link
          to="/admin/orgs"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Organizations
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={org.photos[0]}
              alt={org.name}
              className="h-16 w-16 rounded-2xl object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-bold text-gray-900">{org.name}</h2>
                <StatusBadge status={org.verificationStatus} />
              </div>
              <p className="mt-1 text-sm text-gray-500">{org.tagline}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {org.verificationStatus === "pending" && (
              <>
                <Button
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setApproveDialog(true)}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Verify
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
            {org.verificationStatus === "verified" && (
              <Button
                variant="outline"
                className="gap-2 text-red-600 hover:text-red-700"
                onClick={() => setRejectDialog(true)}
              >
                <ShieldAlert className="h-4 w-4" />
                Revoke Verification
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">About</h3>
              <p className="text-sm leading-relaxed text-gray-600">{org.bio}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Photo Gallery</h3>
              <div className="grid grid-cols-3 gap-3">
                {org.photos.map((photo, i) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-lg">
                    <img
                      src={photo}
                      alt={`${org.name} photo ${i + 1}`}
                      className="h-full w-full object-cover hover:scale-105 transition duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>

            {orgCampaigns.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">
                  Campaigns ({orgCampaigns.length})
                </h3>
                <div className="space-y-3">
                  {orgCampaigns.map((c) => (
                    <Link
                      key={c.id}
                      to="/admin/campaigns/$id"
                      params={{ id: c.id }}
                      className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src={c.cover}
                        alt={c.title}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{c.title}</p>
                        <p className="text-xs text-gray-500">
                          {formatMoney(c.raised)} raised · {c.donors} donors
                        </p>
                      </div>
                      <StatusBadge status={c.verificationStatus} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total Received</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatMoney(org.totalReceived)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Supporters</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {org.supporters.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Campaigns</span>
                  <span className="text-sm font-semibold text-gray-900">{orgCampaigns.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Founded</span>
                  <span className="text-sm font-semibold text-gray-900">{org.founded}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {org.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Megaphone className="h-4 w-4 text-gray-400" />
                  {org.denomination}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Founded {org.founded}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Verification</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <StatusBadge status={org.verificationStatus} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Category</span>
                  <AdminBadge variant={org.category}>
                    {org.category.charAt(0).toUpperCase() + org.category.slice(1)}
                  </AdminBadge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdminConfirmDialog
        open={approveDialog}
        onOpenChange={setApproveDialog}
        title="Verify Organization"
        description={`Are you sure you want to verify ${org.name}? They will receive a verification badge on their profile and all campaigns.`}
        confirmLabel="Verify Organization"
        onConfirm={() => {
          verifyOrg(org.id, "verified");
          toast.success(`${org.name} has been verified`);
        }}
      />

      <AdminRejectDialog
        open={rejectDialog}
        onOpenChange={setRejectDialog}
        title={`Reject ${org.name}`}
        onReject={(reason) => {
          verifyOrg(org.id, "rejected", reason);
          toast.error(`${org.name} has been rejected`);
        }}
      />
    </AdminPageWrapper>
  );
}
