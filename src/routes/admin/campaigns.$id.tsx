import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, MapPin, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { formatMoney } from "@/lib/mock";
import { pending, simulateNetwork } from "@/lib/api";
import { btn } from "@/components/app/btn";
import { Segments } from "@/components/app/Segments";
import { AdminCard, AdminPage, DetailList } from "@/components/admin/AdminLayout";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminRejectDialog } from "@/components/admin/AdminRejectDialog";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminDetailSkeleton } from "@/components/admin/AdminSkeletons";
import { StatusBadge, UrgencyBadge } from "@/components/admin/AdminBadge";
import { campaignTypeLabel } from "@/components/admin/labels";

export const Route = createFileRoute("/admin/campaigns/$id")({
  loader: () => simulateNetwork(),
  pendingComponent: () => <AdminDetailSkeleton label="Loading campaign" />,
  ...pending,
  component: AdminCampaignDetail,
});

function AdminCampaignDetail() {
  const { id } = Route.useParams();
  const campaigns = useApp((s) => s.campaigns);
  const orgs = useApp((s) => s.orgs);
  const moderate = useApp((s) => s.moderateCampaign);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const c = campaigns.find((x) => x.id === id);
  if (!c) {
    return (
      <AdminPage
        title="Campaign not found"
        crumbs={[{ label: "Campaigns", to: "/admin/campaigns" }]}
      >
        <AdminCard>
          <AdminEmptyState
            icon={<Megaphone className="h-5 w-5" strokeWidth={1.75} />}
            title="This campaign doesn't exist"
            description="It may have been removed, or the link is wrong."
            action={
              <Link to="/admin/campaigns" className={btn("secondary", "sm")}>
                Back to campaigns
              </Link>
            }
          />
        </AdminCard>
      </AdminPage>
    );
  }

  const org = c.orgId ? orgs.find((o) => o.id === c.orgId) : undefined;
  const pct = c.goal ? Math.min(100, Math.round((c.raised / c.goal) * 100)) : null;
  const isPending = c.verificationStatus === "pending" || c.verificationStatus === "unverified";

  return (
    <AdminPage
      crumbs={[{ label: "Campaigns", to: "/admin/campaigns" }, { label: c.title }]}
      title={c.title}
      lead={
        <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <StatusBadge status={c.verificationStatus} />
          <UrgencyBadge urgency={c.urgency} />
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-muted-ink" strokeWidth={1.75} />
            {c.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-muted-ink" strokeWidth={1.75} />
            Created {c.createdAt}
          </span>
        </span>
      }
      actions={
        isPending ? (
          <>
            <button type="button" className={btn("secondary")} onClick={() => setRejecting(true)}>
              Reject
            </button>
            <button type="button" className={btn("primary")} onClick={() => setApproving(true)}>
              Approve campaign
            </button>
          </>
        ) : null
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="overflow-hidden rounded-card border border-line-soft bg-paper">
            <img src={c.cover} alt="" className="aspect-[16/7] w-full object-cover" />
            <div className="p-5 sm:p-6">
              <h2 className="text-[15px] font-semibold text-ink">Story</h2>
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-[1.65] text-ink-soft">
                {c.story}
              </p>
            </div>
          </section>

          {c.gallery.length > 0 ? (
            <AdminCard
              title="Photos"
              action={<span className="text-sm text-muted-ink">{c.gallery.length}</span>}
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {c.gallery.map((photo, i) => (
                  <img
                    key={i}
                    src={photo}
                    alt={`Photo ${i + 1}`}
                    className="aspect-square w-full rounded-field object-cover"
                  />
                ))}
              </div>
            </AdminCard>
          ) : null}

          {c.updates.length > 0 ? (
            <AdminCard
              title="Updates"
              action={<span className="text-sm text-muted-ink">{c.updates.length}</span>}
            >
              <ol className="relative flex flex-col gap-6 border-l border-line-soft pl-5">
                {c.updates.map((u, i) => (
                  <li key={u.id} className="relative">
                    <span
                      aria-hidden
                      className={`absolute -left-[25px] top-1.5 h-2 w-2 rounded-full ring-4 ring-paper ${i === 0 ? "bg-brand" : "bg-line-input"}`}
                    />
                    <p className="text-[13px] text-muted-ink">{u.date}</p>
                    <p className="mt-1 text-sm font-medium text-ink">{u.title}</p>
                    <p className="mt-1 text-sm leading-[1.6] text-ink-soft">{u.body}</p>
                  </li>
                ))}
              </ol>
            </AdminCard>
          ) : null}

          {c.comments.length > 0 ? (
            <AdminCard
              title="Messages from givers"
              action={<span className="text-sm text-muted-ink">{c.comments.length}</span>}
            >
              <ul className="flex flex-col gap-5">
                {c.comments.map((m) => (
                  <li key={m.id} className="flex gap-3">
                    <img
                      src={m.avatar}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm">
                        <span className="font-medium text-ink">{m.author}</span>{" "}
                        <span className="text-[13px] text-muted-ink">{m.date}</span>
                      </p>
                      <p className="mt-1 text-sm leading-[1.6] text-ink-soft">{m.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </AdminCard>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <AdminCard title="Progress">
            <p className="font-display text-[28px] leading-none tracking-[-0.02em] text-ink">
              {formatMoney(c.raised)}
            </p>
            <p className="mt-2 text-sm text-muted-ink">
              {c.goal ? `raised of ${formatMoney(c.goal)}` : "given so far, ongoing support"}
            </p>
            {pct !== null ? <Segments pct={pct} className="mt-4" /> : null}
            <p className="mt-3 flex justify-between text-sm text-muted-ink">
              <span>
                <span className="font-semibold text-ink">{c.donors.toLocaleString()}</span> givers
              </span>
              {pct !== null ? <span className="font-semibold text-ink">{pct}%</span> : null}
            </p>
          </AdminCard>

          <AdminCard title="Organiser">
            <div className="flex items-center gap-3">
              <img src={c.raiser.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{c.raiser.name}</p>
                <p className="text-[13px] text-muted-ink">{c.raiser.location}</p>
              </div>
            </div>
            {org ? (
              <Link
                to="/admin/orgs/$id"
                params={{ id: org.id }}
                className="mt-4 flex items-center gap-3 rounded-field border border-line-soft p-3 transition-colors hover:border-line-input"
              >
                <img src={org.photos[0]} alt="" className="h-8 w-8 rounded-[8px] object-cover" />
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{org.name}</span>
                <StatusBadge status={org.verificationStatus} />
              </Link>
            ) : null}
          </AdminCard>

          <AdminCard title="Details">
            <DetailList
              rows={[
                { label: "Asking for", value: campaignTypeLabel[c.type] },
                { label: "Kind", value: c.mode === "ongoing" ? "Ongoing" : "One-time" },
                { label: "Cause", value: c.faithCategory },
                { label: "Urgency", value: <UrgencyBadge urgency={c.urgency} /> },
              ]}
            />
          </AdminCard>

          {c.donations.length > 0 ? (
            <AdminCard title="Recent gifts">
              <ul className="flex flex-col divide-y divide-line-soft">
                {c.donations.slice(0, 5).map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{d.donor}</p>
                      <p className="text-[13px] text-muted-ink">{d.date}</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-ink">
                      {formatMoney(d.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            </AdminCard>
          ) : null}
        </div>
      </div>

      <AdminConfirmDialog
        open={approving}
        onOpenChange={setApproving}
        title="Approve this campaign?"
        description="It goes live and givers can find it straight away."
        confirmLabel="Approve"
        onConfirm={() => {
          moderate(c.id, "verified");
          toast.success("Campaign approved and live");
        }}
      />
      <AdminRejectDialog
        open={rejecting}
        onOpenChange={setRejecting}
        title="Reject this campaign?"
        onReject={(reason) => {
          moderate(c.id, "rejected", reason);
          toast("Campaign rejected");
        }}
      />
    </AdminPage>
  );
}
