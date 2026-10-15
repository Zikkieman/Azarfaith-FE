import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Building2, Download, MapPin, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { formatMoney, type Org } from "@/lib/domain";
import { matches, rejectReasons, timeAgo, type FilterValue } from "@/lib/admin";
import { apiFetch, pending } from "@/lib/api";
import { btn } from "@/components/app/btn";
import { AdminPage } from "@/components/admin/AdminLayout";
import {
  FilterChips,
  FilterMenu,
  SearchField,
  Segmented,
  type FilterField,
} from "@/components/admin/AdminFilterBar";
import { AdminTable, type BulkAction, type Column } from "@/components/admin/AdminTable";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminRejectDialog } from "@/components/admin/AdminRejectDialog";
import { AdminListSkeleton } from "@/components/admin/AdminSkeletons";
import { StatusBadge } from "@/components/admin/AdminBadge";
import { OrgPanel } from "@/components/admin/OrgReview";
import { orgCategoryLabel } from "@/components/admin/labels";
import { downloadCsv } from "@/components/admin/csv";

const views = ["pending", "verified", "unverified", "rejected", "all"] as const;
type View = (typeof views)[number];

export const Route = createFileRoute("/admin/orgs/")({
  validateSearch: (s: Record<string, unknown>): { view: View } => ({
    view: views.includes(s.view as View) ? (s.view as View) : "all",
  }),
  pendingComponent: () => <AdminListSkeleton label="Loading organizations" />,
  ...pending,
  head: () => ({ meta: [{ title: "Organizations — AzarFaith admin" }] }),
  component: AdminOrgs,
});

type ReviewOrg = Org & { createdAt: string; registrationDocuments: string[] };
type ApiOrganization = Omit<ReviewOrg, "videos">;
const stateOf = (o: Org) =>
  o.location.split(",").pop()?.replace("State", "").trim() || "Unspecified";

function AdminOrgs() {
  const { view } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const organizations = useQuery({
    queryKey: ["admin", "organizations"],
    queryFn: () => apiFetch<ApiOrganization[]>("/admin/review/organizations"),
  });
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterValue>({});
  const [open, setOpen] = useState<ReviewOrg | null>(null);
  const [bulkVerify, setBulkVerify] = useState<ReviewOrg[] | null>(null);
  const [bulkReject, setBulkReject] = useState<ReviewOrg[] | null>(null);
  const decision = useMutation({
    mutationFn: async ({
      organizations: selected,
      status,
      reason,
    }: {
      organizations: ReviewOrg[];
      status: "VERIFIED" | "UNVERIFIED";
      reason?: string;
    }) =>
      Promise.all(
        selected.map((organization) =>
          apiFetch(`/admin/review/organizations/${organization.id}/status`, {
            method: "PATCH",
            body: JSON.stringify({
              status,
              reviewAction: status === "VERIFIED" ? "APPROVED" : "REJECTED",
              ...(reason ? { reason } : {}),
            }),
          }),
        ),
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
      ]);
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Could not update the selected organizations.",
      ),
  });

  // Hooks must run in the same order while the query changes from loading to ready.
  const orgs: ReviewOrg[] = (organizations.data ?? []).map((organization) => ({
    ...organization,
    videos: [],
  }));
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orgs.filter(
      (o) =>
        (view === "all" || o.verificationStatus === view) &&
        matches(filters, "category", o.category) &&
        matches(filters, "state", stateOf(o)) &&
        (!q || [o.name, o.location, o.denomination].some((x) => x.toLowerCase().includes(q))),
    );
  }, [orgs, view, filters, search]);

  if (organizations.isLoading) return <AdminListSkeleton label="Loading organizations" />;
  if (organizations.error) throw organizations.error;

  const fields: FilterField[] = [
    {
      key: "category",
      label: "Category",
      icon: Building2,
      options: Object.entries(orgCategoryLabel).map(([value, label]) => ({ value, label })),
    },
    {
      key: "state",
      label: "State",
      icon: MapPin,
      options: [...new Set(orgs.map(stateOf))].sort().map((s) => ({ value: s, label: s })),
    },
  ];

  const count = (v: View) =>
    v === "all" ? orgs.length : orgs.filter((o) => o.verificationStatus === v).length;

  const reviewable = (o: Org) =>
    o.verificationStatus === "pending" || o.verificationStatus === "unverified";

  const columns: Column<ReviewOrg>[] = [
    {
      key: "name",
      header: "Organization",
      sortValue: (o) => o.name,
      cell: (o) => (
        <div className="flex items-center gap-3">
          <img src={o.photos[0]} alt="" className="h-8 w-8 shrink-0 rounded-[8px] object-cover" />
          <div className="min-w-0">
            <p className="max-w-[260px] truncate font-medium text-ink" title={o.name}>
              {o.name}
            </p>
            <p className="truncate text-[12px] text-muted-ink">{o.location}</p>
          </div>
        </div>
      ),
    },
    { key: "status", header: "Status", cell: (o) => <StatusBadge status={o.verificationStatus} /> },
    {
      key: "category",
      header: "Category",
      className: "hidden xl:table-cell",
      cell: (o) => <span className="text-ink-soft">{orgCategoryLabel[o.category]}</span>,
    },
    {
      key: "received",
      header: "Received",
      align: "right",
      sortValue: (o) => o.totalReceived,
      cell: (o) =>
        o.totalReceived ? (
          <span className="text-ink">{formatMoney(o.totalReceived)}</span>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "applied",
      header: "Applied",
      className: "hidden lg:table-cell",
      sortValue: (o) => o.createdAt,
      cell: (o) => <span className="text-ink-soft">{timeAgo(o.createdAt)}</span>,
    },
  ];

  const bulk = (selected: ReviewOrg[]): BulkAction[] => {
    const canReview = selected.filter(reviewable);
    return [
      ...(canReview.length
        ? [
            {
              label: "Verify",
              icon: BadgeCheck,
              onSelect: () => setBulkVerify(canReview),
            },
            {
              label: "Reject",
              icon: ShieldX,
              onSelect: () => setBulkReject(canReview),
              tone: "danger" as const,
            },
          ]
        : []),
      {
        label: "Export",
        icon: Download,
        onSelect: () => {
          downloadCsv(
            "organizations.csv",
            ["Name", "Status", "Category", "Location", "Received"],
            selected.map((o) => [
              o.name,
              o.verificationStatus,
              o.category,
              o.location,
              String(o.totalReceived),
            ]),
          );
          toast(`Exported ${selected.length} organization${selected.length > 1 ? "s" : ""}`);
        },
      },
    ];
  };

  const hasFilters = Boolean(search || Object.values(filters).some((v) => v.length));
  const isQueue = view === "pending";

  return (
    <AdminPage
      title={isQueue ? "Verify organizations" : "Organizations"}
      count={rows.length}
      lead={
        isQueue
          ? "Open each application, run the checks, then verify or reject."
          : "Every organization on AzarFaith, verified or not."
      }
      crumbs={[{ label: isQueue ? "Verify organizations" : "Organizations" }]}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Segmented
            value={view}
            onChange={(v) => navigate({ to: "/admin/orgs", search: { view: v } })}
            items={[
              { value: "pending", label: "Pending review", count: count("pending") },
              { value: "verified", label: "Verified", count: count("verified") },
              { value: "unverified", label: "Unverified", count: count("unverified") },
              { value: "rejected", label: "Rejected", count: count("rejected") },
              { value: "all", label: "All", count: count("all") },
            ]}
          />
          <div className="flex items-center gap-2">
            <div className="flex-1 sm:flex-none">
              <SearchField value={search} onChange={setSearch} placeholder="Search organizations" />
            </div>
            <FilterMenu fields={fields} value={filters} onChange={setFilters} />
          </div>
        </div>
        <FilterChips fields={fields} value={filters} onChange={setFilters} />
      </div>

      <AdminTable
        label="Organizations"
        noun={["organization", "organizations"]}
        rows={rows}
        columns={columns}
        onRowClick={setOpen}
        activeId={open?.id}
        bulkActions={bulk}
        initialSort={isQueue ? { key: "applied", dir: "asc" } : null}
        rowAction={(o) =>
          reviewable(o) ? (
            <button type="button" className={btn("secondary", "sm")} onClick={() => setOpen(o)}>
              Review
            </button>
          ) : null
        }
        mobileRow={(o) => (
          <div className="flex items-center gap-3">
            <img
              src={o.photos[0]}
              alt=""
              className="h-10 w-10 shrink-0 rounded-[8px] object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{o.name}</p>
              <p className="mt-1 flex items-center gap-2">
                <StatusBadge status={o.verificationStatus} />
              </p>
            </div>
          </div>
        )}
        empty={
          hasFilters ? (
            <AdminEmptyState
              icon={<Building2 className="h-5 w-5" strokeWidth={1.75} />}
              title="No organizations match"
              description="Nothing fits this search and these filters."
              action={
                <button
                  type="button"
                  className={btn("secondary", "sm")}
                  onClick={() => {
                    setSearch("");
                    setFilters({});
                  }}
                >
                  Clear search and filters
                </button>
              }
            />
          ) : isQueue ? (
            <AdminEmptyState
              icon={<BadgeCheck className="h-5 w-5" strokeWidth={1.75} />}
              title="No applications waiting"
              description="New organizations show up here as soon as they apply."
            />
          ) : (
            <AdminEmptyState
              icon={<Building2 className="h-5 w-5" strokeWidth={1.75} />}
              title="Nothing here yet"
              description="No organizations have this status."
            />
          )
        }
      />

      <OrgPanel
        org={open ? (orgs.find((o) => o.id === open.id) ?? null) : null}
        onClose={() => setOpen(null)}
      />

      <AdminConfirmDialog
        open={Boolean(bulkVerify)}
        onOpenChange={(v) => !v && setBulkVerify(null)}
        title={`Verify ${bulkVerify?.length ?? 0} organizations?`}
        description={bulkVerify?.map((o) => o.name).join(", ")}
        consequences={[
          "Each gets the verified tick and can receive gifts.",
          "We email each organization to let them know.",
        ]}
        confirmLabel="Verify all"
        onConfirm={() => {
          if (bulkVerify)
            decision.mutate(
              { organizations: bulkVerify, status: "VERIFIED" },
              {
                onSuccess: () => {
                  setBulkVerify(null);
                  toast.success(`${bulkVerify.length} organizations verified`);
                },
              },
            );
        }}
      />
      <AdminRejectDialog
        open={Boolean(bulkReject)}
        onOpenChange={(v) => !v && setBulkReject(null)}
        title={`Reject ${bulkReject?.length ?? 0} organization${(bulkReject?.length ?? 0) > 1 ? "s" : ""}?`}
        description={bulkReject?.map((o) => o.name).join(", ")}
        reasons={rejectReasons.org}
        onReject={(reason) => {
          if (bulkReject)
            decision.mutate(
              { organizations: bulkReject, status: "UNVERIFIED", reason },
              {
                onSuccess: () => {
                  setBulkReject(null);
                  toast(`${bulkReject.length} rejected`);
                },
              },
            );
        }}
      />
    </AdminPage>
  );
}
