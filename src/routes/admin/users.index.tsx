import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Eye, UserCheck, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { formatMoney, type User } from "@/lib/mock";
import { pending, simulateNetwork } from "@/lib/api";
import { Tabs } from "@/components/app/AppShell";
import { AdminPage } from "@/components/admin/AdminLayout";
import { AdminSelect, AdminToolbar } from "@/components/admin/AdminFilterBar";
import { AdminTable, type Column, type RowAction } from "@/components/admin/AdminTable";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminRejectDialog } from "@/components/admin/AdminRejectDialog";
import { AdminListSkeleton } from "@/components/admin/AdminSkeletons";
import { AccountBadge } from "@/components/admin/AdminBadge";
import { roleLabel } from "@/components/admin/labels";

export const Route = createFileRoute("/admin/users/")({
  loader: () => simulateNetwork(),
  pendingComponent: () => <AdminListSkeleton label="Loading users" />,
  ...pending,
  head: () => ({ meta: [{ title: "Users — AzarFaith admin" }] }),
  component: AdminUsers,
});

type Role = "all" | User["role"];

const checks = (u: User) =>
  [u.emailVerified, u.phoneVerified, u.bvnVerified].filter(Boolean).length;

function AdminUsers() {
  const users = useApp((s) => s.users);
  const suspendUser = useApp((s) => s.suspendUser);
  const reactivateUser = useApp((s) => s.reactivateUser);
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [suspending, setSuspending] = useState<User | null>(null);
  const [reactivating, setReactivating] = useState<User | null>(null);

  const count = (r: Role) =>
    r === "all" ? users.length : users.filter((u) => u.role === r).length;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (role === "all" || u.role === role) &&
        (!status || u.status === status) &&
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    );
  }, [users, role, status, search]);

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (u) => u.name,
      cell: (u) => (
        <div className="flex items-center gap-3">
          <img src={u.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{u.name}</p>
            <p className="truncate text-[13px] text-muted-ink">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      className: "hidden md:table-cell",
      cell: (u) => <span className="text-ink-soft">{roleLabel[u.role]}</span>,
    },
    { key: "status", header: "Status", cell: (u) => <AccountBadge status={u.status} /> },
    {
      key: "checks",
      header: "Checks",
      className: "hidden lg:table-cell",
      sortValue: checks,
      cell: (u) => (
        <span
          className="inline-flex items-center gap-1.5 text-ink-soft"
          title={`Email ${u.emailVerified ? "verified" : "not verified"}, phone ${u.phoneVerified ? "verified" : "not verified"}, BVN ${u.bvnVerified ? "verified" : "not verified"}`}
        >
          <BadgeCheck
            className={checks(u) === 3 ? "h-4 w-4 text-verified" : "h-4 w-4 text-subtle"}
            strokeWidth={2}
          />
          {checks(u)} of 3
        </span>
      ),
    },
    {
      key: "given",
      header: "Given",
      align: "right",
      sortValue: (u) => u.totalGiven,
      cell: (u) => <span className="font-medium text-ink">{formatMoney(u.totalGiven)}</span>,
    },
    {
      key: "joined",
      header: "Joined",
      className: "hidden xl:table-cell",
      sortValue: (u) => u.joinedAt,
      cell: (u) => <span className="text-ink-soft">{u.joinedAt}</span>,
    },
  ];

  const open = (u: User) => navigate({ to: "/admin/users/$id", params: { id: u.id } });
  const actions = (u: User): RowAction[] => [
    { label: "Open", icon: Eye, onSelect: () => open(u) },
    ...(u.status === "active" && u.role !== "platform_admin"
      ? [
          {
            label: "Suspend",
            icon: UserX,
            onSelect: () => setSuspending(u),
            tone: "danger" as const,
          },
        ]
      : []),
    ...(u.status === "suspended"
      ? [{ label: "Reactivate", icon: UserCheck, onSelect: () => setReactivating(u) }]
      : []),
  ];

  const clear = search || status ? () => (setSearch(""), setStatus("")) : undefined;

  return (
    <AdminPage
      title="Users"
      lead="Everyone with an AzarFaith account: givers, organization admins and the team."
      crumbs={[{ label: "Users" }]}
    >
      <div className="flex flex-col gap-5">
        <Tabs
          value={role}
          onChange={setRole}
          items={[
            { value: "all", label: "All", count: count("all") },
            { value: "donor", label: "Givers", count: count("donor") },
            { value: "org_admin", label: "Organization admins", count: count("org_admin") },
            { value: "platform_admin", label: "Platform admins", count: count("platform_admin") },
          ]}
        />
        <AdminToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search by name or email"
          onClear={clear}
        >
          <AdminSelect
            label="Any status"
            value={status}
            onChange={setStatus}
            options={[
              { label: "Active", value: "active" },
              { label: "Suspended", value: "suspended" },
            ]}
          />
        </AdminToolbar>
        <AdminTable
          label="Users"
          rows={rows}
          columns={columns}
          onRowClick={open}
          rowMenu={actions}
          minWidth={780}
          empty={
            <AdminEmptyState
              icon={<Users className="h-5 w-5" strokeWidth={1.75} />}
              title="No users match"
              description="Try another search, role or status."
            />
          }
        />
      </div>

      <AdminRejectDialog
        open={!!suspending}
        onOpenChange={(v) => !v && setSuspending(null)}
        title={`Suspend ${suspending?.name ?? "this user"}?`}
        description="They won't be able to sign in or give until you reactivate them. Give a reason for the record."
        confirmLabel="Suspend"
        onReject={(reason) => {
          if (!suspending) return;
          suspendUser(suspending.id, reason);
          toast(`${suspending.name} was suspended`);
        }}
      />
      <AdminConfirmDialog
        open={!!reactivating}
        onOpenChange={(v) => !v && setReactivating(null)}
        title={`Reactivate ${reactivating?.name ?? "this user"}?`}
        description="They can sign in and give again straight away."
        confirmLabel="Reactivate"
        onConfirm={() => {
          if (!reactivating) return;
          reactivateUser(reactivating.id);
          toast.success(`${reactivating.name} was reactivated`);
        }}
      />
    </AdminPage>
  );
}
