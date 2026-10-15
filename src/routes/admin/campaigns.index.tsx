import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Download,
  Flame,
  HandCoins,
  Heart,
  Megaphone,
  Repeat2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { type Campaign } from "@/lib/domain";
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
import { StatusBadge, UrgencyBadge } from "@/components/admin/AdminBadge";
import { CampaignPanel } from "@/components/admin/CampaignReview";
import { campaignTypeLabel } from "@/components/admin/labels";
import { downloadCsv } from "@/components/admin/csv";

const views = ["pending", "verified", "unverified", "rejected", "all"] as const;
type View = (typeof views)[number];

export const Route = createFileRoute("/admin/campaigns/")({
  validateSearch: (s: Record<string, unknown>): { view: View } => ({
    view: views.includes(s.view as View) ? (s.view as View) : "all",
  }),
  pendingComponent: () => <AdminListSkeleton label="Loading campaigns" />,
  ...pending,
  head: () => ({ meta: [{ title: "Campaigns — AzarFaith admin" }] }),
  component: AdminCampaigns,
});

type ApiCampaign = Omit<Campaign, "gallery" | "currency" | "updates" | "comments" | "donations" | "raiser"> & {
  raiser: Omit<Campaign["raiser"], "trustScore">;
  organization?: { id: string; name: string } | null;
};

type ApiOrganization = { id: string; verificationStatus: Campaign["verificationStatus"] };

const formatMoney = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

function AdminCampaigns() {
  const { view } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const campaignQuery = useQuery({
    queryKey: ["admin", "campaigns"],
    queryFn: () => apiFetch<ApiCampaign[]>("/admin/review/campaigns"),
  });
  const organizationQuery = useQuery({
    queryKey: ["admin", "organizations"],
    queryFn: () => apiFetch<ApiOrganization[]>("/admin/review/organizations"),
  });
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterValue>({});
  const [open, setOpen] = useState<Campaign | null>(null);
  const [bulkApprove, setBulkApprove] = useState<Campaign[] | null>(null);
  const [bulkReject, setBulkReject] = useState<Campaign[] | null>(null);
  const decision = useMutation({
    mutationFn: async ({ selected, status, reason }: { selected: Campaign[]; status: "VERIFIED" | "UNVERIFIED"; reason?: string }) =>
      Promise.all(
        selected.map((campaign) =>
          apiFetch(`/admin/review/campaigns/${campaign.id}/status`, {
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
        queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
      ]);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update the selected campaigns."),
  });

  if (campaignQuery.isLoading || organizationQuery.isLoading) {
    return <AdminListSkeleton label="Loading campaigns" />;
  }
  if (campaignQuery.error) throw campaignQuery.error;
  if (organizationQuery.error) throw organizationQuery.error;

  const campaigns: Campaign[] = (campaignQuery.data ?? []).map((campaign) => ({
    ...campaign,
    raiser: { ...campaign.raiser, trustScore: 0 },
    gallery: [],
    currency: "NGN",
    updates: [],
    comments: [],
    donations: [],
  }));
  const verifiedOrganizationIds = new Set(
    (organizationQuery.data ?? [])
      .filter((organization) => organization.verificationStatus === "verified")
      .map((organization) => organization.id),
  );

  const fields: FilterField[] = [
    {
      key: "mode",
      label: "Kind",
      icon: Repeat2,
      options: [
        { value: "one-time", label: "One-time" },
        { value: "ongoing", label: "Ongoing" },
      ],
    },
    {
      key: "type",
      label: "Asking for",
      icon: HandCoins,
      options: Object.entries(campaignTypeLabel).map(([value, label]) => ({ value, label })),
    },
    {
      key: "cause",
      label: "Cause",
      icon: Heart,
      options: [...new Set(campaigns.map((campaign) => campaign.faithCategory))]
        .sort()
        .map((cause) => ({ value: cause, label: cause })),
    },
    {
      key: "urgency",
      label: "Urgency",
      icon: Flame,
      options: ["critical", "high", "medium", "low"].map((urgency) => ({
        value: urgency,
        label: urgency[0].toUpperCase() + urgency.slice(1),
      })),
    },
  ];

  const count = (v: View) =>
    v === "all" ? campaigns.length : campaigns.filter((c) => c.verificationStatus === v).length;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return campaigns.filter(
      (c) =>
        (view === "all" || c.verificationStatus === view) &&
        matches(filters, "mode", c.mode) &&
        matches(filters, "type", c.type) &&
        matches(filters, "cause", c.faithCategory) &&
        matches(filters, "urgency", c.urgency) &&
        (!q || [c.title, c.raiser.name, c.location].some((x) => x.toLowerCase().includes(q))),
    );
  }, [campaigns, view, filters, search]);

  const reviewable = (c: Campaign) =>
    c.verificationStatus === "pending" || c.verificationStatus === "unverified";
  const blocked = (c: Campaign) => Boolean(c.orgId && !verifiedOrganizationIds.has(c.orgId));

  const columns: Column<Campaign>[] = [
    {
      key: "title",
      header: "Campaign",
      sortValue: (c) => c.title,
      cell: (c) => (
        <div className="flex items-center gap-3">
          <img src={c.cover} alt="" className="h-8 w-8 shrink-0 rounded-[8px] object-cover" />
          <div className="min-w-0">
            <p className="max-w-[300px] truncate font-medium text-ink" title={c.title}>
              {c.title}
            </p>
            <p className="truncate text-[12px] text-muted-ink">{c.raiser.name}</p>
          </div>
        </div>
      ),
    },
    { key: "status", header: "Status", cell: (c) => <StatusBadge status={c.verificationStatus} /> },
    {
      key: "urgency",
      header: "Urgency",
      className: "hidden md:table-cell",
      sortValue: (c) => ["low", "medium", "high", "critical"].indexOf(c.urgency),
      cell: (c) => <UrgencyBadge urgency={c.urgency} />,
    },
    {
      key: "kind",
      header: "Asking for",
      className: "hidden xl:table-cell",
      cell: (c) => (
        <span className="text-ink-soft">
          {campaignTypeLabel[c.type]}, {c.mode === "ongoing" ? "ongoing" : "one-time"}
        </span>
      ),
    },
    {
      key: "raised",
      header: "Raised",
      align: "right",
      sortValue: (c) => c.raised,
      cell: (c) => (
        <span className="flex flex-col items-end">
          <span className="text-ink">{formatMoney(c.raised)}</span>
          {c.goal ? (
            <span className="text-[12px] text-muted-ink">
              {Math.min(100, Math.round((c.raised / c.goal) * 100))}% of goal
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: "created",
      header: "Submitted",
      className: "hidden lg:table-cell",
      sortValue: (c) => c.createdAt,
      cell: (c) => <span className="text-ink-soft">{timeAgo(c.createdAt)}</span>,
    },
  ];

  const bulk = (selected: Campaign[]): BulkAction[] => {
    const canReview = selected.filter(reviewable);
    const stuck = canReview.filter(blocked);
    return [
      ...(canReview.length
        ? [
            {
              label: "Approve",
              icon: CheckCircle2,
              onSelect: () => setBulkApprove(canReview),
              disabledReason: stuck.length
                ? `${stuck.length} of ${canReview.length} have an unverified organizer`
                : undefined,
            },
            {
              label: "Reject",
              icon: XCircle,
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
            "campaigns.csv",
            ["Title", "Organizer", "Status", "Raised", "Goal", "Givers"],
            selected.map((c) => [
              c.title,
              c.raiser.name,
              c.verificationStatus,
              String(c.raised),
              String(c.goal ?? ""),
              String(c.donors),
            ]),
          );
          toast(`Exported ${selected.length} campaign${selected.length > 1 ? "s" : ""}`);
        },
      },
    ];
  };

  const hasFilters = Boolean(search || Object.values(filters).some((v) => v.length));
  const isQueue = view === "pending";

  return (
    <AdminPage
      title={isQueue ? "Review campaigns" : "Campaigns"}
      count={rows.length}
      lead={
        isQueue
          ? "New campaigns wait here before givers can see them."
          : "Every campaign on AzarFaith, live or not."
      }
      crumbs={[{ label: isQueue ? "Review campaigns" : "Campaigns" }]}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Segmented
            value={view}
            onChange={(v) => navigate({ to: "/admin/campaigns", search: { view: v } })}
            items={[
              { value: "pending", label: "Pending review", count: count("pending") },
              { value: "verified", label: "Live", count: count("verified") },
              { value: "unverified", label: "Unverified", count: count("unverified") },
              { value: "rejected", label: "Rejected", count: count("rejected") },
              { value: "all", label: "All", count: count("all") },
            ]}
          />
          <div className="flex items-center gap-2">
            <div className="flex-1 sm:flex-none">
              <SearchField value={search} onChange={setSearch} placeholder="Search campaigns" />
            </div>
            <FilterMenu fields={fields} value={filters} onChange={setFilters} />
          </div>
        </div>
        <FilterChips fields={fields} value={filters} onChange={setFilters} />
      </div>

      <AdminTable
        label="Campaigns"
        noun={["campaign", "campaigns"]}
        rows={rows}
        columns={columns}
        onRowClick={setOpen}
        activeId={open?.id}
        bulkActions={bulk}
        initialSort={isQueue ? { key: "created", dir: "asc" } : null}
        rowAction={(c) =>
          reviewable(c) ? (
            <button type="button" className={btn("secondary", "sm")} onClick={() => setOpen(c)}>
              Review
            </button>
          ) : null
        }
        mobileRow={(c) => (
          <div className="flex items-center gap-3">
            <img src={c.cover} alt="" className="h-10 w-10 shrink-0 rounded-[8px] object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{c.title}</p>
              <p className="mt-1 flex items-center gap-2 text-[12px] text-muted-ink">
                <StatusBadge status={c.verificationStatus} />
                {formatMoney(c.raised)}
              </p>
            </div>
          </div>
        )}
        empty={
          hasFilters ? (
            <AdminEmptyState
              icon={<Megaphone className="h-5 w-5" strokeWidth={1.75} />}
              title="No campaigns match"
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
              icon={<CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />}
              title="Nothing to review"
              description="New campaigns appear here the moment they're submitted."
            />
          ) : (
            <AdminEmptyState
              icon={<Megaphone className="h-5 w-5" strokeWidth={1.75} />}
              title="Nothing here yet"
              description="No campaigns have this status."
            />
          )
        }
      />

      <CampaignPanel
        campaign={open ? (campaigns.find((campaign) => campaign.id === open.id) ?? null) : null}
        onClose={() => setOpen(null)}
      />

      <AdminConfirmDialog
        open={Boolean(bulkApprove)}
        onOpenChange={(v) => !v && setBulkApprove(null)}
        title={`Approve ${bulkApprove?.length ?? 0} campaign${(bulkApprove?.length ?? 0) > 1 ? "s" : ""}?`}
        description={bulkApprove?.map((c) => c.title).join(", ")}
        consequences={[
          "Each goes live in Discover and on the map.",
          "Each organizer gets an email.",
        ]}
        confirmLabel="Approve all"
        onConfirm={async () => {
          if (!bulkApprove?.length) return;
          await decision.mutateAsync({ selected: bulkApprove, status: "VERIFIED" });
          setBulkApprove(null);
          toast.success(`${bulkApprove.length} campaign${bulkApprove.length === 1 ? "" : "s"} approved`);
        }}
      />
      <AdminRejectDialog
        open={Boolean(bulkReject)}
        onOpenChange={(v) => !v && setBulkReject(null)}
        title={`Reject ${bulkReject?.length ?? 0} campaign${(bulkReject?.length ?? 0) > 1 ? "s" : ""}?`}
        description={bulkReject?.map((c) => c.title).join(", ")}
        reasons={rejectReasons.campaign}
        onReject={async (reason) => {
          if (!bulkReject?.length) return;
          await decision.mutateAsync({ selected: bulkReject, status: "UNVERIFIED", reason });
          setBulkReject(null);
          toast.success(`${bulkReject.length} campaign${bulkReject.length === 1 ? "" : "s"} rejected`);
        }}
      />
    </AdminPage>
  );
}
