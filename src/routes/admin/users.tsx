import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, UserX, UserCheck, Users, ShieldCheck, Phone, Mail } from "lucide-react";
import { listAdminUsers, updateAdminUserStatus } from "@/features/catalog/api";
import { formatMoney } from "@/lib/catalog";
import { AdminPageWrapper } from "@/components/admin/AdminLayout";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminBadge } from "@/components/admin/AdminBadge";
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
import { PageSpinner } from "@/components/PageSpinner";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const isClient = typeof window !== "undefined";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users", { search }],
    queryFn: () => listAdminUsers({ search: search || undefined }),
    enabled: isClient,
  });
  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: "active" | "suspended";
      reason?: string;
    }) => updateAdminUserStatus(id, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const perPage = 10;

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = !roleFilter || u.role === roleFilter;
      const matchStatus = !statusFilter || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <AdminPageWrapper title="Users">
      <div className="space-y-4">
        <AdminFilterBar
          searchValue={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder="Search users..."
          filters={[
            {
              label: "All Roles",
              value: "role",
              options: [
                { label: "Donor", value: "donor" },
                { label: "Org Admin", value: "org_admin" },
                { label: "Platform Admin", value: "platform_admin" },
              ],
              onChange: (v) => {
                setRoleFilter(v);
                setPage(1);
              },
            },
            {
              label: "All Status",
              value: "status",
              options: [
                { label: "Active", value: "active" },
                { label: "Suspended", value: "suspended" },
              ],
              onChange: (v) => {
                setStatusFilter(v);
                setPage(1);
              },
            },
          ]}
          activeFilters={[roleFilter, statusFilter].filter(Boolean)}
          onClearFilters={() => {
            setSearch("");
            setRoleFilter("");
            setStatusFilter("");
            setPage(1);
          }}
        />

        {paginated.length === 0 ? (
          isLoading ? (
            <PageSpinner label="Loading users..." fullScreen={false} />
          ) : (
            <AdminEmptyState
              icon={<Users className="h-6 w-6" />}
              title="No users found"
              description="No users match your current filters."
            />
          )
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Given</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                    <TableCell>
                      <AdminBadge
                        variant={
                          user.role === "platform_admin"
                            ? "verified"
                            : user.role === "org_admin"
                              ? "ongoing"
                              : "unverified"
                        }
                      >
                        {user.role === "platform_admin"
                          ? "Platform Admin"
                          : user.role === "org_admin"
                            ? "Org Admin"
                            : "Donor"}
                      </AdminBadge>
                    </TableCell>
                    <TableCell>
                      <AdminBadge variant={user.status === "active" ? "active" : "suspended"}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </AdminBadge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {user.phoneVerified && <Phone className="h-3.5 w-3.5 text-emerald-500" />}
                        {user.emailVerified && <Mail className="h-3.5 w-3.5 text-emerald-500" />}
                        {user.bvnVerified && (
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                        {!user.phoneVerified && !user.emailVerified && !user.bvnVerified && (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-gray-900">
                      {formatMoney(user.totalGiven)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to="/admin/users/$id" params={{ id: user.id }}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {user.status === "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({
                                id: user.id,
                                status: "suspended",
                                reason: "Suspended by admin from the users list.",
                              })
                            }
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                        {user.status === "suspended" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-600 hover:text-emerald-700"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({
                                id: user.id,
                                status: "active",
                              })
                            }
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
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
    </AdminPageWrapper>
  );
}
