import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Eye, Megaphone, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { formatMoney, type Campaign } from "@/lib/mock";
import { pending, simulateNetwork } from "@/lib/api";
import { Tabs } from "@/components/app/AppShell";
import { AdminPage } from "@/components/admin/AdminLayout";
import { AdminSelect, AdminToolbar } from "@/components/admin/AdminFilterBar";
import { AdminTable, type Column, type RowAction } from "@/components/admin/AdminTable";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminRejectDialog } from "@/components/admin/AdminRejectDialog";
import { AdminListSkeleton } from "@/components/admin/AdminSkeletons";
import { StatusBadge, UrgencyBadge } from "@/components/admin/AdminBadge";
import { campaignTypeLabel } from "@/components/admin/labels";

export const Route = createFileRoute("/admin/campaigns/")({
  loader: () => simulateNetwork(),
  pendingComponent: () => <AdminListSkeleton label="Loading campaigns" />,
  ...pending,
  head: () => ({ meta: [{ title: "Campaigns — AzarFaith admin" }] }),
  component: AdminCampaigns,
});

type Status = "all" | Campaign["verificationStatus"];

function AdminCampaigns() {
  const campaigns = useApp((s) => s.campaigns);
  const moderate = useApp((s) => s.moderateCampaign);
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("all");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("");
  const [type, setType] = useState("");
  const [approving, setApproving] = useState<Campaign | null>(null);
  const [rejecting, setRejecting] = useState<Campaign | null>(null);

  const count = (s: Status) =>
    s === "all" ? campaigns.length : campaigns.filter((c) => c.verificationStatus === s).length;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return campaigns.filter(
      (c) =>
        (status === "all" || c.verificationStatus === status) &&
        (!mode || c.mode === mode) &&
        (!type || c.type === type) &&
        (!q || c.title.toLowerCase().includes(q) || c.raiser.name.toLowerCase().includes(q)),
    );
  }, [campaigns, status, mode, type, search]);

  const columns: Column<Campaign>[] = [
    {
      key: "title",
      header: "Campaign",
      sortValue: (c) => c.title,
      cell: (c) => (
        <div className="flex items-center gap-3">
          <img src={c.cover} alt="" className="h-9 w-9 shrink-0 rounded-[8px] object-cover" />
          <div className="min-w-0">
            <p className="max-w-[280px] truncate font-medium text-ink">{c.title}</p>
            <p className="truncate text-[13px] text-muted-ink">{c.raiser.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Asking for",
      className: "hidden lg:table-cell",
      cell: (c) => (
        <span className="text-ink-soft">
          {campaignTypeLabel[c.type]}, {c.mode === "ongoing" ? "ongoing" : "one-time"}
        </span>
      ),
    },
    {
      key: "urgency",
      header: "Urgency",
      className: "hidden md:table-cell",
      sortValue: (c) => ["low", "medium", "high", "critical"].indexOf(c.urgency),
      cell: (c) => <UrgencyBadge urgency={c.urgency} />,
    },
    { key: "status", header: "Status", cell: (c) => <StatusBadge status={c.verificationStatus} /> },
    {
      key: "raised",
      header: "Raised",
      align: "right",
      sortValue: (c) => c.raised,
      cell: (c) => <span className="font-medium text-ink">{formatMoney(c.raised)}</span>,
    },
    {
      key: "givers",
      header: "Givers",
      align: "right",
      className: "hidden xl:table-cell",
      sortValue: (c) => c.donors,
      cell: (c) => <span className="text-ink-soft">{c.donors.toLocaleString()}</span>,
    },
  ];

  const open = (c: Campaign) => navigate({ to: "/admin/campaigns/$id", params: { id: c.id } });
  const actions = (c: Campaign): RowAction[] => [
    { label: "Open", icon: Eye, onSelect: () => open(c) },
    ...(c.verificationStatus === "pending" || c.verificationStatus === "unverified"
      ? [
          { label: "Approve", icon: CheckCircle2, onSelect: () => setApproving(c) },
          {
            label: "Reject",
            icon: XCircle,
            onSelect: () => setRejecting(c),
            tone: "danger" as const,
          },
        ]
      : []),
  ];

  const clear =
    search || mode || type ? () => (setSearch(""), setMode(""), setType("")) : undefined;

  return (
    <AdminPage
      title="Campaigns"
      lead="Review new campaigns before they reach givers, and keep an eye on the live ones."
      crumbs={[{ label: "Campaigns" }]}
    >
      <div className="flex flex-col gap-5">
        <Tabs
          value={status}
          onChange={setStatus}
          items={[
            { value: "all", label: "All", count: count("all") },
            { value: "pending", label: "Pending review", count: count("pending") },
            { value: "verified", label: "Live", count: count("verified") },
            { value: "unverified", label: "Unverified", count: count("unverified") },
            { value: "rejected", label: "Rejected", count: count("rejected") },
          ]}
        />
        <AdminToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search by title or organiser"
          onClear={clear}
        >
          <AdminSelect
            label="Any kind"
            value={mode}
            onChange={setMode}
            options={[
              { label: "One-time", value: "one-time" },
              { label: "Ongoing", value: "ongoing" },
            ]}
          />
          <AdminSelect
            label="Asking for anything"
            value={type}
            onChange={setType}
            options={Object.entries(campaignTypeLabel).map(([value, label]) => ({ value, label }))}
          />
        </AdminToolbar>
        <AdminTable
          label="Campaigns"
          rows={rows}
          columns={columns}
          onRowClick={open}
          rowMenu={actions}
          minWidth={820}
          empty={
            <AdminEmptyState
              icon={<Megaphone className="h-5 w-5" strokeWidth={1.75} />}
              title="No campaigns match"
              description="Try another search, status or filter."
            />
          }
        />
      </div>

      <AdminConfirmDialog
        open={!!approving}
        onOpenChange={(v) => !v && setApproving(null)}
        title="Approve this campaign?"
        description={
          <>
            <span className="font-medium text-ink">{approving?.title}</span> goes live and givers
            can find it straight away.
          </>
        }
        confirmLabel="Approve"
        onConfirm={() => {
          if (!approving) return;
          moderate(approving.id, "verified");
          toast.success("Campaign approved and live");
        }}
      />
      <AdminRejectDialog
        open={!!rejecting}
        onOpenChange={(v) => !v && setRejecting(null)}
        title="Reject this campaign?"
        onReject={(reason) => {
          if (!rejecting) return;
          moderate(rejecting.id, "rejected", reason);
          toast("Campaign rejected");
        }}
      />
    </AdminPage>
  );
}
