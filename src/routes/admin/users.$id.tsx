import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ShieldCheck,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Megaphone,
  AlertTriangle,
} from "lucide-react";
import {
  getAdminUser,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "@/features/catalog/api";
import { formatMoney } from "@/lib/catalog";
import { AdminPageWrapper } from "@/components/admin/AdminLayout";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminRejectDialog } from "@/components/admin/AdminRejectDialog";
import { AdminBadge, StatusBadge } from "@/components/admin/AdminBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PageSpinner } from "@/components/PageSpinner";

export const Route = createFileRoute("/admin/users/$id")({
  component: AdminUserDetail,
});

function AdminUserDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [suspendDialog, setSuspendDialog] = useState(false);
  const [reactivateDialog, setReactivateDialog] = useState(false);
  const [roleDialog, setRoleDialog] = useState(false);
  const { data: user, isLoading } = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: () => getAdminUser(id),
  });
  const statusMutation = useMutation({
    mutationFn: ({
      status,
      reason,
    }: {
      status: "active" | "suspended";
      reason?: string;
    }) => updateAdminUserStatus(id, { status, reason }),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["admin", "user", id], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setSuspendDialog(false);
      setReactivateDialog(false);
      toast.success("User status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  const roleMutation = useMutation({
    mutationFn: (role: "donor" | "org_admin" | "platform_admin") =>
      updateAdminUserRole(id, { role }),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["admin", "user", id], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setRoleDialog(false);
      toast.success("User role updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (!user) {
    if (isLoading) {
      return (
        <AdminPageWrapper title="Loading User">
          <PageSpinner label="Loading user..." fullScreen={false} />
        </AdminPageWrapper>
      );
    }

    return (
      <AdminPageWrapper title="User Not Found">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-gray-500">User not found.</p>
          <Link to="/admin/users">
            <Button variant="ghost" className="mt-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Button>
          </Link>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper title={user.name}>
      <div className="space-y-6">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="h-16 w-16 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-bold text-gray-900">{user.name}</h2>
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
                <AdminBadge variant={user.status === "active" ? "active" : "suspended"}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </AdminBadge>
              </div>
              <p className="mt-1 text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {user.status === "active" && (
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => setSuspendDialog(true)}
              >
                <AlertTriangle className="h-4 w-4" />
                Suspend
              </Button>
            )}
            {user.status === "suspended" && (
              <Button
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setReactivateDialog(true)}
              >
                <ShieldCheck className="h-4 w-4" />
                Reactivate
              </Button>
            )}
            <Button variant="outline" className="gap-2" onClick={() => setRoleDialog(true)}>
              Change Role
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Profile Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{user.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{user.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Joined</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{user.joinedAt}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Verification Status</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${user.phoneVerified ? "bg-emerald-50" : "bg-gray-100"}`}
                  >
                    <Phone
                      className={`h-4 w-4 ${user.phoneVerified ? "text-emerald-600" : "text-gray-400"}`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-xs text-gray-500">
                      {user.phoneVerified ? "Verified" : "Not verified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${user.emailVerified ? "bg-emerald-50" : "bg-gray-100"}`}
                  >
                    <Mail
                      className={`h-4 w-4 ${user.emailVerified ? "text-emerald-600" : "text-gray-400"}`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-xs text-gray-500">
                      {user.emailVerified ? "Verified" : "Not verified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${user.bvnVerified ? "bg-emerald-50" : "bg-gray-100"}`}
                  >
                    <ShieldCheck
                      className={`h-4 w-4 ${user.bvnVerified ? "text-emerald-600" : "text-gray-400"}`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">BVN</p>
                    <p className="text-xs text-gray-500">
                      {user.bvnVerified ? "Verified" : "Not verified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {user.suspendReason && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <h3 className="mb-2 text-sm font-semibold text-red-800">Suspension Details</h3>
                <p className="text-sm text-red-700">{user.suspendReason}</p>
                {user.suspendedAt && (
                  <p className="mt-1 text-xs text-red-600">Suspended on {user.suspendedAt}</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Activity Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatMoney(user.totalGiven)}
                    </p>
                    <p className="text-xs text-gray-500">Total Given</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <Megaphone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.donationsCount}</p>
                    <p className="text-xs text-gray-500">Donations Made</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                    <Megaphone className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.campaignsCreated}</p>
                    <p className="text-xs text-gray-500">Campaigns Created</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Account Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Role</span>
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
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <AdminBadge variant={user.status === "active" ? "active" : "suspended"}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </AdminBadge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Joined</span>
                  <span className="text-sm text-gray-700">{user.joinedAt}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdminRejectDialog
        open={suspendDialog}
        onOpenChange={setSuspendDialog}
        title={`Suspend ${user.name}`}
        description="Suspended users cannot login or make donations. Please provide a reason."
        onReject={(reason) => {
          statusMutation.mutate({ status: "suspended", reason });
        }}
      />

      <AdminConfirmDialog
        open={reactivateDialog}
        onOpenChange={setReactivateDialog}
        title={`Reactivate ${user.name}`}
        description="Are you sure you want to reactivate this user? They will regain full access to the platform."
        confirmLabel="Reactivate"
        onConfirm={() => {
          statusMutation.mutate({ status: "active" });
        }}
      />

      <RoleChangeDialog
        open={roleDialog}
        onOpenChange={setRoleDialog}
        currentRole={user.role}
        onRoleChange={(role) => {
          roleMutation.mutate(role);
        }}
      />
    </AdminPageWrapper>
  );
}

function RoleChangeDialog({
  open,
  onOpenChange,
  currentRole,
  onRoleChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRole: string;
  onRoleChange: (role: "donor" | "org_admin" | "platform_admin") => void;
}) {
  const [selectedRole, setSelectedRole] = useState(currentRole);

  return (
    <AdminConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Change User Role"
      description="Select the new role for this user."
      confirmLabel="Update Role"
      onConfirm={() => onRoleChange(selectedRole as "donor" | "org_admin" | "platform_admin")}
    />
  );
}
