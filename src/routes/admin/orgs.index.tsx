import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, Eye, ShieldCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { formatMoney, type Org } from "@/lib/mock";
import { pending, simulateNetwork } from "@/lib/api";
import { Tabs, Tag } from "@/components/app/AppShell";
import { AdminPage } from "@/components/admin/AdminLayout";
import { AdminSelect, AdminToolbar } from "@/components/admin/AdminFilterBar";
import { AdminTable, type Column, type RowAction } from "@/components/admin/AdminTable";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminRejectDialog } from "@/components/admin/AdminRejectDialog";
import { AdminListSkeleton } from "@/components/admin/AdminSkeletons";
import { StatusBadge } from "@/components/admin/AdminBadge";
import { orgCategoryLabel } from "@/components/admin/labels";

export const Route = createFileRoute("/admin/orgs/")({
  loader: () => simulateNetwork(),
  pendingComponent: () => <AdminListSkeleton label="Loading organizations" />,
  ...pending,
  head: () => ({ meta: [{ title: "Organizations — AzarFaith admin" }] }),
  component: AdminOrgs,
});

type Status = "all" | Org["verificationStatus"];

function AdminOrgs() {
  const orgs = useApp((s) => s.orgs);
  const verifyOrg = useApp((s) => s.verifyOrg);
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [verifying, setVerifying] = useState<Org | null>(null);
  const [rejecting, setRejecting] = useState<Org | null>(null);

  const count = (s: Status) =>
    s === "all" ? orgs.length : orgs.filter((o) => o.verificationStatus === s).length;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orgs.filter(
      (o) =>
        (status === "all" || o.verificationStatus === status) &&
        (!category || o.category === category) &&
        (!q || o.name.toLowerCase().includes(q) || o.location.toLowerCase().includes(q)),
    );
  }, [orgs, status, category, search]);

  const columns: Column<Org>[] = [
    {
      key: "name",
      header: "Organization",
      sortValue: (o) => o.name,
      cell: (o) => (
        <div className="flex items-center gap-3">
          <img src={o.photos[0]} alt="" className="h-9 w-9 shrink-0 rounded-[8px] object-cover" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{o.name}</p>
            <p className="truncate text-[13px] text-muted-ink">{o.location}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      className: "hidden md:table-cell",
      cell: (o) => <span className="text-ink-soft">{orgCategoryLabel[o.category]}</span>,
    },
    { key: "status", header: "Status", cell: (o) => <StatusBadge status={o.verificationStatus} /> },
    {
      key: "received",
      header: "Received",
      align: "right",
      sortValue: (o) => o.totalReceived,
      cell: (o) => <span className="font-medium text-ink">{formatMoney(o.totalReceived)}</span>,
    },
    {
      key: "givers",
      header: "Givers",
      align: "right",
      className: "hidden lg:table-cell",
      sortValue: (o) => o.supporters,
      cell: (o) => <span className="text-ink-soft">{o.supporters.toLocaleString()}</span>,
    },
  ];

  const open = (o: Org) => navigate({ to: "/admin/orgs/$id", params: { id: o.id } });
  const actions = (o: Org): RowAction[] => [
    { label: "Open", icon: Eye, onSelect: () => open(o) },
    ...(o.verificationStatus === "pending" || o.verificationStatus === "unverified"
      ? [
          { label: "Verify", icon: ShieldCheck, onSelect: () => setVerifying(o) },
          {
            label: "Reject",
            icon: ShieldX,
            onSelect: () => setRejecting(o),
            tone: "danger" as const,
          },
        ]
      : []),
  ];

  const clear = search || category ? () => (setSearch(""), setCategory("")) : undefined;

  return (
    <AdminPage
      title="Organizations"
      lead="Check documents, verify organizations and keep the directory trustworthy."
      crumbs={[{ label: "Organizations" }]}
    >
      <div className="flex flex-col gap-5">
        <Tabs
          value={status}
          onChange={setStatus}
          items={[
            { value: "all", label: "All", count: count("all") },
            { value: "pending", label: "Pending review", count: count("pending") },
            { value: "verified", label: "Verified", count: count("verified") },
            { value: "unverified", label: "Unverified", count: count("unverified") },
            { value: "rejected", label: "Rejected", count: count("rejected") },
          ]}
        />
        <AdminToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search by name or place"
          onClear={clear}
        >
          <AdminSelect
            label="All categories"
            value={category}
            onChange={setCategory}
            options={Object.entries(orgCategoryLabel).map(([value, label]) => ({ value, label }))}
          />
        </AdminToolbar>
        <AdminTable
          label="Organizations"
          rows={rows}
          columns={columns}
          onRowClick={open}
          rowMenu={actions}
          empty={
            <AdminEmptyState
              icon={<Building2 className="h-5 w-5" strokeWidth={1.75} />}
              title="No organizations match"
              description="Try another search, status or category."
            />
          }
        />
      </div>

      <AdminConfirmDialog
        open={!!verifying}
        onOpenChange={(v) => !v && setVerifying(null)}
        title={`Verify ${verifying?.name ?? "organization"}?`}
        description="They get the verified tick on their profile and every campaign, and can receive gifts."
        confirmLabel="Verify"
        onConfirm={() => {
          if (!verifying) return;
          verifyOrg(verifying.id, "verified");
          toast.success(`${verifying.name} is verified`);
        }}
      >
        {verifying ? (
          <div className="flex items-center gap-3 rounded-field bg-panel p-3">
            <img
              src={verifying.photos[0]}
              alt=""
              className="h-10 w-10 rounded-[8px] object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{verifying.name}</p>
              <p className="text-[13px] text-muted-ink">
                {orgCategoryLabel[verifying.category]}, {verifying.location}
              </p>
            </div>
            <span className="ml-auto">
              <Tag tone="attention">Pending review</Tag>
            </span>
          </div>
        ) : null}
      </AdminConfirmDialog>

      <AdminRejectDialog
        open={!!rejecting}
        onOpenChange={(v) => !v && setRejecting(null)}
        title={`Reject ${rejecting?.name ?? "organization"}?`}
        onReject={(reason) => {
          if (!rejecting) return;
          verifyOrg(rejecting.id, "rejected", reason);
          toast(`${rejecting.name} was rejected`);
        }}
      />
    </AdminPage>
  );
}
