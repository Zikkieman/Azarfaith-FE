import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Building2,
  CircleDashed,
  HeartHandshake,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { formatMoney, type UserRole } from "@/lib/mock";
import { pending, simulateNetwork } from "@/lib/api";
import { btn } from "@/components/app/btn";
import { ChoiceCard } from "@/components/app/AppShell";
import { AdminCard, AdminPage, DetailList } from "@/components/admin/AdminLayout";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminRejectDialog } from "@/components/admin/AdminRejectDialog";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminDetailSkeleton } from "@/components/admin/AdminSkeletons";
import { AccountBadge, RoleBadge } from "@/components/admin/AdminBadge";
import { roleLabel } from "@/components/admin/labels";

export const Route = createFileRoute("/admin/users/$id")({
  loader: () => simulateNetwork(),
  pendingComponent: () => <AdminDetailSkeleton label="Loading user" />,
  ...pending,
  component: AdminUserDetail,
});

const roles: { value: UserRole; icon: typeof Users; description: string }[] = [
  { value: "donor", icon: HeartHandshake, description: "Gives to campaigns and follows updates." },
  {
    value: "org_admin",
    icon: Building2,
    description: "Runs an organization's profile, campaigns and payouts.",
  },
  {
    value: "platform_admin",
    icon: ShieldCheck,
    description: "Full access to this admin, including verification and settings.",
  },
];

function AdminUserDetail() {
  const { id } = Route.useParams();
  const users = useApp((s) => s.users);
  const suspendUser = useApp((s) => s.suspendUser);
  const reactivateUser = useApp((s) => s.reactivateUser);
  const updateUserRole = useApp((s) => s.updateUserRole);
  const [suspending, setSuspending] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [changingRole, setChangingRole] = useState(false);
  const [role, setRole] = useState<UserRole>("donor");

  const user = users.find((u) => u.id === id);
  if (!user) {
    return (
      <AdminPage title="User not found" crumbs={[{ label: "Users", to: "/admin/users" }]}>
        <AdminCard>
          <AdminEmptyState
            icon={<Users className="h-5 w-5" strokeWidth={1.75} />}
            title="This user doesn't exist"
            description="They may have deleted their account, or the link is wrong."
            action={
              <Link to="/admin/users" className={btn("secondary", "sm")}>
                Back to users
              </Link>
            }
          />
        </AdminCard>
      </AdminPage>
    );
  }

  const verificationRows = [
    { label: "Email", ok: user.emailVerified },
    { label: "Phone", ok: user.phoneVerified },
    { label: "BVN", ok: user.bvnVerified },
  ];

  return (
    <AdminPage
      crumbs={[{ label: "Users", to: "/admin/users" }, { label: user.name }]}
      title={
        <span className="flex items-center gap-4">
          <img src={user.avatar} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
          <span className="min-w-0">{user.name}</span>
        </span>
      }
      lead={
        <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <AccountBadge status={user.status} />
          <RoleBadge role={user.role} />
          <span>{user.email}</span>
        </span>
      }
      actions={
        <>
          <button
            type="button"
            className={btn("secondary")}
            onClick={() => {
              setRole(user.role);
              setChangingRole(true);
            }}
          >
            Change role
          </button>
          {user.status === "active" && user.role !== "platform_admin" ? (
            <button
              type="button"
              className={`${btn("secondary")} text-danger hover:border-danger`}
              onClick={() => setSuspending(true)}
            >
              Suspend
            </button>
          ) : null}
          {user.status === "suspended" ? (
            <button type="button" className={btn("primary")} onClick={() => setReactivating(true)}>
              Reactivate
            </button>
          ) : null}
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          {user.suspendReason ? (
            <section className="rounded-card border border-danger/20 bg-danger/5 p-5 sm:p-6">
              <h2 className="text-[15px] font-semibold text-danger">Suspended</h2>
              <p className="mt-1 text-[15px] leading-[1.6] text-ink">{user.suspendReason}</p>
              {user.suspendedAt ? (
                <p className="mt-2 text-[13px] text-muted-ink">Since {user.suspendedAt}</p>
              ) : null}
            </section>
          ) : null}

          <AdminCard title="Profile">
            <DetailList
              rows={[
                { label: "Full name", value: user.name },
                { label: "Email", value: user.email },
                { label: "Phone", value: user.phone },
                { label: "Joined", value: user.joinedAt },
                { label: "Role", value: roleLabel[user.role] },
              ]}
            />
          </AdminCard>

          <AdminCard title="Identity checks">
            <ul className="grid gap-3 sm:grid-cols-3">
              {verificationRows.map((v) => (
                <li
                  key={v.label}
                  className="flex items-center gap-3 rounded-field border border-line-soft p-3"
                >
                  {v.ok ? (
                    <BadgeCheck className="h-5 w-5 shrink-0 text-verified" strokeWidth={1.75} />
                  ) : (
                    <CircleDashed className="h-5 w-5 shrink-0 text-subtle" strokeWidth={1.75} />
                  )}
                  <span>
                    <span className="block text-sm font-medium text-ink">{v.label}</span>
                    <span className="block text-[13px] text-muted-ink">
                      {v.ok ? "Verified" : "Not verified"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </AdminCard>
        </div>

        <AdminCard title="Activity" className="self-start">
          <DetailList
            rows={[
              { label: "Total given", value: formatMoney(user.totalGiven) },
              { label: "Gifts made", value: user.donationsCount.toLocaleString() },
              { label: "Campaigns started", value: user.campaignsCreated },
            ]}
          />
        </AdminCard>
      </div>

      <AdminRejectDialog
        open={suspending}
        onOpenChange={setSuspending}
        title={`Suspend ${user.name}?`}
        description="They won't be able to sign in or give until you reactivate them. Give a reason for the record."
        confirmLabel="Suspend"
        onReject={(reason) => {
          suspendUser(user.id, reason);
          toast(`${user.name} was suspended`);
        }}
      />
      <AdminConfirmDialog
        open={reactivating}
        onOpenChange={setReactivating}
        title={`Reactivate ${user.name}?`}
        description="They can sign in and give again straight away."
        confirmLabel="Reactivate"
        onConfirm={() => {
          reactivateUser(user.id);
          toast.success(`${user.name} was reactivated`);
        }}
      />
      <AdminConfirmDialog
        open={changingRole}
        onOpenChange={setChangingRole}
        title={`Change ${user.name}'s role`}
        description="Roles decide what they can see and do on AzarFaith."
        confirmLabel="Update role"
        onConfirm={() => {
          if (role === user.role) return;
          updateUserRole(user.id, role);
          toast.success(`${user.name} is now ${roleLabel[role].toLowerCase()}`);
        }}
      >
        <div className="flex flex-col gap-2.5">
          {roles.map((r) => (
            <ChoiceCard
              key={r.value}
              selected={role === r.value}
              onClick={() => setRole(r.value)}
              icon={<r.icon className="h-5 w-5" strokeWidth={1.5} />}
              title={roleLabel[r.value]}
              description={r.description}
            />
          ))}
        </div>
      </AdminConfirmDialog>
    </AdminPage>
  );
}
