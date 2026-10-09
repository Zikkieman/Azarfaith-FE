import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Building2,
  Calendar,
  CircleDashed,
  Fingerprint,
  HeartHandshake,
  Mail,
  Phone,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { formatMoney, type UserRole } from "@/lib/mock";
import { pending, simulateNetwork } from "@/lib/api";
import { btn } from "@/components/app/btn";
import { ChoiceCard, Tabs } from "@/components/app/AppShell";
import { AdminPage } from "@/components/admin/AdminLayout";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminRejectDialog } from "@/components/admin/AdminRejectDialog";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminDetailSkeleton } from "@/components/admin/AdminSkeletons";
import { AccountBadge } from "@/components/admin/AdminBadge";
import { Field, FieldGroup, Notes, Timeline } from "@/components/admin/AdminParts";
import { roleLabel } from "@/components/admin/labels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/users/$id")({
  loader: () => simulateNetwork(),
  pendingComponent: () => <AdminDetailSkeleton label="Loading user" />,
  ...pending,
  component: AdminUserDetail,
});

const ME = "u1";

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
    description: "Full access to this admin, including verification.",
  },
];

type Tab = "overview" | "activity" | "notes";

function AdminUserDetail() {
  const { id } = Route.useParams();
  const users = useApp((s) => s.users);
  const log = useApp((s) => s.auditLog);
  const noteCount = useApp((s) => s.notes[id]?.length ?? 0);
  const suspendUser = useApp((s) => s.suspendUser);
  const reactivateUser = useApp((s) => s.reactivateUser);
  const updateUserRole = useApp((s) => s.updateUserRole);
  const [tab, setTab] = useState<Tab>("overview");
  const [suspending, setSuspending] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [changingRole, setChangingRole] = useState(false);
  const [role, setRole] = useState<UserRole>("donor");

  const index = users.findIndex((u) => u.id === id);
  const user = users[index];
  if (!user) {
    return (
      <AdminPage title="User not found" crumbs={[{ label: "Users", to: "/admin/users" }]}>
        <AdminEmptyState
          icon={<Users className="h-5 w-5" strokeWidth={1.75} />}
          title="This user doesn't exist"
          description="They may have deleted their account, or the link is wrong."
          action={
            <Link to="/admin/users" search={{ view: "all" }} className={btn("secondary", "sm")}>
              Back to users
            </Link>
          }
        />
      </AdminPage>
    );
  }

  const isMe = user.id === ME;
  const history = log.filter((e) => e.target.id === user.id);
  const step = (i: number) =>
    users[i] ? { to: "/admin/users/$id", params: { id: users[i].id } } : undefined;
  const suspendBlock = isMe
    ? "You can't suspend your own account."
    : user.role === "platform_admin"
      ? "Platform admins can't be suspended. Change their role first."
      : undefined;
  const checks = [
    { label: "Email", ok: user.emailVerified, icon: Mail },
    { label: "Phone", ok: user.phoneVerified, icon: Phone },
    { label: "BVN", ok: user.bvnVerified, icon: ShieldCheck },
  ];

  return (
    <AdminPage
      crumbs={[
        { label: "Users", to: "/admin/users", search: { view: "all" } },
        { label: user.name },
      ]}
      pager={{
        index: index + 1,
        total: users.length,
        prev: step(index - 1),
        next: step(index + 1),
      }}
      title={
        <span className="flex items-center gap-3">
          <img src={user.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          <span className="min-w-0">
            {user.name}
            {isMe ? <span className="ml-2 font-gsf text-[15px] text-muted-ink">(you)</span> : null}
          </span>
        </span>
      }
      lead={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <AccountBadge status={user.status} />
          <span>{roleLabel[user.role]}</span>
          <span aria-hidden>·</span>
          <span>
            Joined{" "}
            {new Date(user.joinedAt).toLocaleDateString("en-NG", {
              month: "long",
              year: "numeric",
            })}
          </span>
        </span>
      }
      actions={
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isMe}
              title={isMe ? "You can't change your own role." : undefined}
              className={btn("secondary")}
              onClick={() => {
                setRole(user.role);
                setChangingRole(true);
              }}
            >
              <UserCog className="h-4 w-4" strokeWidth={1.75} /> Change role
            </button>
            {user.status === "suspended" ? (
              <button
                type="button"
                className={btn("primary")}
                onClick={() => setReactivating(true)}
              >
                Reactivate
              </button>
            ) : (
              <button
                type="button"
                disabled={Boolean(suspendBlock)}
                title={suspendBlock}
                className={cn(btn("secondary"), "text-danger hover:border-danger")}
                onClick={() => setSuspending(true)}
              >
                Suspend
              </button>
            )}
          </div>
          {suspendBlock && user.status === "active" ? (
            <p className="text-[12px] text-muted-ink">{suspendBlock}</p>
          ) : null}
        </div>
      }
    >
      {user.suspendReason ? (
        <div className="flex flex-col gap-1 rounded-field border border-danger/20 bg-danger/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-danger">
              Suspended{user.suspendedAt ? ` since ${user.suspendedAt}` : ""}
            </p>
            <p className="text-sm text-ink-soft">{user.suspendReason}</p>
          </div>
        </div>
      ) : null}

      <div className="grid overflow-hidden rounded-card border border-line-soft lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b border-line-soft bg-panel/40 px-4 py-2 lg:border-b-0 lg:border-r">
          <FieldGroup title="Contact">
            <Field icon={Mail} label="Email" copy={user.email}>
              {user.email}
            </Field>
            <Field icon={Phone} label="Phone" copy={user.phone}>
              {user.phone}
            </Field>
          </FieldGroup>
          <FieldGroup title="Account">
            <Field icon={UserCog} label="Role">
              {roleLabel[user.role]}
            </Field>
            <Field icon={Calendar} label="Joined">
              {user.joinedAt}
            </Field>
            <Field icon={Fingerprint} label="ID" copy={user.id}>
              {user.id}
            </Field>
          </FieldGroup>
          <FieldGroup title="Identity checks">
            {checks.map((c) => (
              <Field key={c.label} icon={c.icon} label={c.label}>
                {c.ok ? (
                  <span className="inline-flex items-center gap-1 text-verified-ink">
                    <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} /> Confirmed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-muted-ink">
                    <CircleDashed className="h-3.5 w-3.5" strokeWidth={2} /> Not confirmed
                  </span>
                )}
              </Field>
            ))}
          </FieldGroup>
        </aside>

        <div className="min-w-0 px-5 pb-6 pt-4 sm:px-6">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "overview", label: "Overview" },
              { value: "activity", label: "Activity", count: history.length },
              { value: "notes", label: "Notes", count: noteCount },
            ]}
          />
          <div key={tab} className="admin-rise pt-5">
            {tab === "overview" ? (
              <dl className="grid divide-y divide-line-soft rounded-field border border-line-soft sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {[
                  { label: "Total given", value: formatMoney(user.totalGiven) },
                  { label: "Gifts made", value: user.donationsCount.toLocaleString() },
                  { label: "Campaigns started", value: user.campaignsCreated.toString() },
                ].map((s) => (
                  <div key={s.label} className="p-4">
                    <dt className="text-[13px] text-muted-ink">{s.label}</dt>
                    <dd className="mt-1.5 font-display text-[22px] leading-none text-ink">
                      {s.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {tab === "activity" ? <Timeline entries={history} /> : null}
            {tab === "notes" ? <Notes recordId={user.id} /> : null}
          </div>
        </div>
      </div>

      <AdminRejectDialog
        open={suspending}
        onOpenChange={setSuspending}
        title={`Suspend ${user.name}?`}
        description="They can't sign in or give until you reactivate them. Their past gifts stay as they are."
        confirmLabel="Suspend"
        reasons={[
          "Suspicious payment activity",
          "Reported by an organization",
          "Fake or duplicate account",
        ]}
        onReject={(reason, notify) => {
          suspendUser(user.id, reason);
          toast(`${user.name} was suspended${notify ? ". We've emailed them" : ""}`);
        }}
      />
      <AdminConfirmDialog
        open={reactivating}
        onOpenChange={setReactivating}
        title={`Reactivate ${user.name}?`}
        consequences={[
          "They can sign in and give again straight away.",
          "We email them to say they're back.",
        ]}
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
        confirmDisabled={role === user.role}
        onConfirm={() => {
          updateUserRole(user.id, role);
          toast.success(`${user.name} is now ${roleLabel[role].toLowerCase()}`);
        }}
      >
        <div className="flex flex-col gap-2">
          {roles.map((r) => (
            <ChoiceCard
              key={r.value}
              selected={role === r.value}
              onClick={() => setRole(r.value)}
              icon={<r.icon className="h-5 w-5" strokeWidth={1.5} />}
              title={r.value === user.role ? `${roleLabel[r.value]} (current)` : roleLabel[r.value]}
              description={r.description}
            />
          ))}
        </div>
      </AdminConfirmDialog>
    </AdminPage>
  );
}
