import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Calendar, Church, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { formatMoney } from "@/lib/mock";
import { pending, simulateNetwork } from "@/lib/api";
import { btn } from "@/components/app/btn";
import { Tag } from "@/components/app/AppShell";
import { AdminCard, AdminPage, DetailList } from "@/components/admin/AdminLayout";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminRejectDialog } from "@/components/admin/AdminRejectDialog";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminDetailSkeleton } from "@/components/admin/AdminSkeletons";
import { StatusBadge } from "@/components/admin/AdminBadge";
import { orgCategoryLabel } from "@/components/admin/labels";

export const Route = createFileRoute("/admin/orgs/$id")({
  loader: () => simulateNetwork(),
  pendingComponent: () => <AdminDetailSkeleton label="Loading organization" />,
  ...pending,
  component: AdminOrgDetail,
});

function AdminOrgDetail() {
  const { id } = Route.useParams();
  const orgs = useApp((s) => s.orgs);
  const campaigns = useApp((s) => s.campaigns);
  const verifyOrg = useApp((s) => s.verifyOrg);
  const [verifying, setVerifying] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const org = orgs.find((o) => o.id === id);
  if (!org) {
    return (
      <AdminPage
        title="Organization not found"
        crumbs={[{ label: "Organizations", to: "/admin/orgs" }]}
      >
        <AdminCard>
          <AdminEmptyState
            icon={<Building2 className="h-5 w-5" strokeWidth={1.75} />}
            title="This organization doesn't exist"
            description="It may have been removed, or the link is wrong."
            action={
              <Link to="/admin/orgs" className={btn("secondary", "sm")}>
                Back to organizations
              </Link>
            }
          />
        </AdminCard>
      </AdminPage>
    );
  }

  const orgCampaigns = campaigns.filter((c) => c.orgId === org.id);
  const isPending = org.verificationStatus === "pending" || org.verificationStatus === "unverified";
  const isVerified = org.verificationStatus === "verified";

  return (
    <AdminPage
      crumbs={[{ label: "Organizations", to: "/admin/orgs" }, { label: org.name }]}
      title={
        <span className="flex items-center gap-4">
          <img
            src={org.photos[0]}
            alt=""
            className="h-14 w-14 shrink-0 rounded-field object-cover"
          />
          <span className="min-w-0">{org.name}</span>
        </span>
      }
      lead={
        <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <StatusBadge status={org.verificationStatus} />
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-muted-ink" strokeWidth={1.75} />
            {orgCategoryLabel[org.category]}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-muted-ink" strokeWidth={1.75} />
            {org.location}
          </span>
        </span>
      }
      actions={
        isPending ? (
          <>
            <button type="button" className={btn("secondary")} onClick={() => setRejecting(true)}>
              Reject
            </button>
            <button type="button" className={btn("primary")} onClick={() => setVerifying(true)}>
              Verify organization
            </button>
          </>
        ) : isVerified ? (
          <button
            type="button"
            className={`${btn("secondary")} text-danger hover:border-danger`}
            onClick={() => setRejecting(true)}
          >
            Revoke verification
          </button>
        ) : null
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <AdminCard title="About">
            <p className="text-[15px] font-medium text-ink">{org.tagline}</p>
            <p className="mt-2 text-[15px] leading-[1.65] text-ink-soft">{org.bio}</p>
          </AdminCard>

          <AdminCard
            title="Photos"
            action={<span className="text-sm text-muted-ink">{org.photos.length}</span>}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {org.photos.map((photo, i) => (
                <a
                  key={i}
                  href={photo}
                  target="_blank"
                  rel="noreferrer"
                  className="group block aspect-square overflow-hidden rounded-field bg-panel"
                >
                  <img
                    src={photo}
                    alt={`${org.name}, photo ${i + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.03]"
                  />
                </a>
              ))}
            </div>
          </AdminCard>

          <AdminCard
            title="Campaigns"
            action={<span className="text-sm text-muted-ink">{orgCampaigns.length}</span>}
            bodyClassName="px-2 pb-2 sm:px-3 sm:pb-3"
          >
            {orgCampaigns.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-ink">No campaigns yet.</p>
            ) : (
              <ul className="flex flex-col">
                {orgCampaigns.map((c) => (
                  <li key={c.id}>
                    <Link
                      to="/admin/campaigns/$id"
                      params={{ id: c.id }}
                      className="flex items-center gap-3 rounded-field px-3 py-3 transition-colors hover:bg-panel"
                    >
                      <img
                        src={c.cover}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-[8px] object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {c.title}
                        </span>
                        <span className="block text-[13px] text-muted-ink">
                          {formatMoney(c.raised)} from {c.donors.toLocaleString()} givers
                        </span>
                      </span>
                      <StatusBadge status={c.verificationStatus} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>

        <div className="flex flex-col gap-6">
          <AdminCard title="At a glance">
            <DetailList
              rows={[
                { label: "Total received", value: formatMoney(org.totalReceived) },
                { label: "Givers", value: org.supporters.toLocaleString() },
                { label: "Campaigns", value: orgCampaigns.length },
              ]}
            />
          </AdminCard>
          <AdminCard title="Details">
            <DetailList
              rows={[
                {
                  label: "Denomination",
                  value: (
                    <span className="inline-flex items-center gap-1.5">
                      <Church className="h-4 w-4 text-muted-ink" strokeWidth={1.75} />
                      {org.denomination}
                    </span>
                  ),
                },
                {
                  label: "Founded",
                  value: (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-muted-ink" strokeWidth={1.75} />
                      {org.founded}
                    </span>
                  ),
                },
                { label: "Category", value: <Tag>{orgCategoryLabel[org.category]}</Tag> },
                { label: "Verification", value: <StatusBadge status={org.verificationStatus} /> },
              ]}
            />
          </AdminCard>
        </div>
      </div>

      <AdminConfirmDialog
        open={verifying}
        onOpenChange={setVerifying}
        title={`Verify ${org.name}?`}
        description="They get the verified tick on their profile and every campaign, and can receive gifts."
        confirmLabel="Verify"
        onConfirm={() => {
          verifyOrg(org.id, "verified");
          toast.success(`${org.name} is verified`);
        }}
      />
      <AdminRejectDialog
        open={rejecting}
        onOpenChange={setRejecting}
        title={isVerified ? `Revoke ${org.name}'s verification?` : `Reject ${org.name}?`}
        confirmLabel={isVerified ? "Revoke" : "Reject"}
        onReject={(reason) => {
          verifyOrg(org.id, "rejected", reason);
          toast(isVerified ? `${org.name}'s verification was revoked` : `${org.name} was rejected`);
        }}
      />
    </AdminPage>
  );
}
