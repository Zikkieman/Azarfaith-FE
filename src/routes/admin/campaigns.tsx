import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, ShieldCheck, ShieldAlert } from "lucide-react";
import { useApp } from "@/lib/admin-store";
import { formatMoney } from "@/lib/admin-mock";
import { AdminPageWrapper } from "@/components/admin/AdminLayout";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminRejectDialog } from "@/components/admin/AdminRejectDialog";
import { StatusBadge, AdminBadge } from "@/components/admin/AdminBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/campaigns")({
  component: AdminCampaigns,
});

function AdminCampaigns() {
  const { campaigns, moderateCampaign } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [approveDialog, setApproveDialog] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);

  const perPage = 10;

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const matchSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.raiser.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || c.verificationStatus === statusFilter;
      const matchMode = !modeFilter || c.mode === modeFilter;
      const matchType = !typeFilter || c.type === typeFilter;
      return matchSearch && matchStatus && matchMode && matchType;
    });
  }, [campaigns, search, statusFilter, modeFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <AdminPageWrapper title="Campaigns">
      <div className="space-y-4">
        <AdminFilterBar
          searchValue={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder="Search campaigns..."
          filters={[
            {
              label: "All Status",
              value: "status",
              options: [
                { label: "Verified", value: "verified" },
                { label: "Pending", value: "pending" },
                { label: "Unverified", value: "unverified" },
              ],
              onChange: (v) => {
                setStatusFilter(v);
                setPage(1);
              },
            },
            {
              label: "All Modes",
              value: "mode",
              options: [
                { label: "One-Time", value: "one-time" },
                { label: "Ongoing", value: "ongoing" },
              ],
              onChange: (v) => {
                setModeFilter(v);
                setPage(1);
              },
            },
            {
              label: "All Types",
              value: "type",
              options: [
                { label: "Money", value: "money" },
                { label: "Item", value: "item" },
                { label: "Volunteer", value: "volunteer" },
                { label: "Professional", value: "professional" },
                { label: "Emergency", value: "emergency" },
              ],
              onChange: (v) => {
                setTypeFilter(v);
                setPage(1);
              },
            },
          ]}
          activeFilters={[statusFilter, modeFilter, typeFilter].filter(Boolean)}
          onClearFilters={() => {
            setSearch("");
            setStatusFilter("");
            setModeFilter("");
            setTypeFilter("");
            setPage(1);
          }}
        />

        {paginated.length === 0 ? (
          <AdminEmptyState
            icon={<ShieldCheck className="h-6 w-6" />}
            title="No campaigns found"
            description="No campaigns match your current filters."
          />
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Raiser</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Raised</TableHead>
                  <TableHead className="text-right">Donors</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={campaign.cover}
                          alt={campaign.title}
                          className="h-9 w-9 rounded-lg object-cover"
                        />
                        <p className="max-w-[200px] truncate font-medium text-gray-900">
                          {campaign.title}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AdminBadge
                        variant={
                          campaign.type as
                            | "money"
                            | "item"
                            | "volunteer"
                            | "professional"
                            | "emergency"
                        }
                      >
                        {campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1)}
                      </AdminBadge>
                    </TableCell>
                    <TableCell>
                      <AdminBadge variant={campaign.mode === "ongoing" ? "ongoing" : "one-time"}>
                        {campaign.mode === "ongoing" ? "Ongoing" : "One-Time"}
                      </AdminBadge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{campaign.raiser.name}</TableCell>
                    <TableCell>
                      <AdminBadge variant={campaign.urgency}>
                        {campaign.urgency.charAt(0).toUpperCase() + campaign.urgency.slice(1)}
                      </AdminBadge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={campaign.verificationStatus} />
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-gray-900">
                      {formatMoney(campaign.raised)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-600">
                      {campaign.donors.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to="/admin/campaigns/$id" params={{ id: campaign.id }}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {campaign.verificationStatus === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600 hover:text-emerald-700"
                              onClick={() => setApproveDialog(campaign.id)}
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setRejectDialog(campaign.id)}
                            >
                              <ShieldAlert className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="border-t border-gray-100 px-4 py-3">
              <AdminPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </div>
        )}
      </div>

      <AdminConfirmDialog
        open={!!approveDialog}
        onOpenChange={() => setApproveDialog(null)}
        title="Approve Campaign"
        description="Are you sure you want to approve this campaign? It will become visible to donors."
        confirmLabel="Approve"
        onConfirm={() => {
          if (approveDialog) {
            moderateCampaign(approveDialog, "verified");
            toast.success("Campaign approved and published");
          }
        }}
      />

      <AdminRejectDialog
        open={!!rejectDialog}
        onOpenChange={() => setRejectDialog(null)}
        title="Reject Campaign"
        onReject={(reason) => {
          if (rejectDialog) {
            moderateCampaign(rejectDialog, "rejected", reason);
            toast.error("Campaign rejected");
          }
        }}
      />
    </AdminPageWrapper>
  );
}
