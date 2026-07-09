import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, ShieldCheck, ShieldAlert } from "lucide-react";
import {
  listAdminOrganizations,
  updateAdminOrganizationStatus,
} from "@/features/catalog/api";
import { formatMoney } from "@/lib/catalog";
import { AdminPageWrapper } from "@/components/admin/AdminLayout";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminRejectDialog } from "@/components/admin/AdminRejectDialog";
import { StatusBadge, AdminBadge } from "@/components/admin/AdminBadge";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/PageSpinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orgs")({
  component: AdminOrgs,
});

function AdminOrgs() {
  const isClient = typeof window !== "undefined";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [approveDialog, setApproveDialog] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);

  const perPage = 10;

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["admin", "orgs", { search, statusFilter, categoryFilter }],
    queryFn: () =>
      listAdminOrganizations({
        search: search || undefined,
        status: statusFilter ? statusFilter.toUpperCase() as "VERIFIED" | "PENDING" | "UNVERIFIED" : undefined,
        category: categoryFilter ? categoryFilter.toUpperCase() as "CHURCH" | "MISSION" | "ORPHANAGE" | "SCHOOL" | "OTHER" : undefined,
      }),
    enabled: isClient,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: "VERIFIED" | "UNVERIFIED";
      reason?: string;
    }) =>
      updateAdminOrganizationStatus(id, {
        status,
        reason,
        reviewAction: status === "VERIFIED" ? "APPROVED" : "REJECTED",
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success(
        variables.status === "VERIFIED"
          ? "Organization verified successfully"
          : "Organization moved to unverified.",
      );
      setApproveDialog(null);
      setRejectDialog(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const filtered = useMemo(() => orgs, [orgs]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <AdminPageWrapper title="Organizations">
      <div className="space-y-4">
        <AdminFilterBar
          searchValue={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder="Search organizations..."
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
              label: "All Categories",
              value: "category",
              options: [
                { label: "Church", value: "church" },
                { label: "Mission", value: "mission" },
                { label: "Orphanage", value: "orphanage" },
                { label: "School", value: "school" },
                { label: "Other", value: "other" },
              ],
              onChange: (v) => {
                setCategoryFilter(v);
                setPage(1);
              },
            },
          ]}
          activeFilters={[statusFilter, categoryFilter].filter(Boolean)}
          onClearFilters={() => {
            setSearch("");
            setStatusFilter("");
            setCategoryFilter("");
            setPage(1);
          }}
        />

        {paginated.length === 0 ? (
          isLoading ? (
            <PageSpinner label="Loading organizations..." fullScreen={false} />
          ) : (
            <AdminEmptyState
              icon={<ShieldCheck className="h-6 w-6" />}
              title="No organizations found"
              description="No organizations match your current filters."
            />
          )
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Supporters</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={org.photos[0]}
                          alt={org.name}
                          className="h-9 w-9 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{org.name}</p>
                          <p className="text-xs text-gray-500">{org.denomination}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AdminBadge variant={org.category}>
                        {org.category.charAt(0).toUpperCase() + org.category.slice(1)}
                      </AdminBadge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{org.location}</TableCell>
                    <TableCell>
                      <StatusBadge status={org.verificationStatus} />
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-gray-900">
                      {formatMoney(org.totalReceived)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-600">
                      {org.supporters.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to="/admin/orgs/$id" params={{ id: org.id }}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {org.verificationStatus === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600 hover:text-emerald-700"
                              onClick={() => setApproveDialog(org.id)}
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setRejectDialog(org.id)}
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
        title="Verify Organization"
        description="Are you sure you want to verify this organization? They will receive a verification badge."
        confirmLabel="Verify"
        onConfirm={() => {
          if (approveDialog) {
            updateStatusMutation.mutate({ id: approveDialog, status: "VERIFIED" });
          }
        }}
      />

      <AdminRejectDialog
        open={!!rejectDialog}
        onOpenChange={() => setRejectDialog(null)}
        title="Reject Organization"
        onReject={(reason) => {
          if (rejectDialog) {
            updateStatusMutation.mutate({ id: rejectDialog, status: "UNVERIFIED", reason });
          }
        }}
      />
    </AdminPageWrapper>
  );
}
