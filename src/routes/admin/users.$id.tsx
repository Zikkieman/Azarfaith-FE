import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Building2, Calendar, CircleDashed, Fingerprint, HeartHandshake, Mail, Phone, ShieldCheck, UserCog, Users } from "lucide-react";
import { toast } from "sonner";
import { formatMoney, type User, type UserRole } from "@/lib/domain";
import { ApiError, apiFetch, pending } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { btn } from "@/components/app/btn";
import { ChoiceCard, Tabs } from "@/components/app/AppShell";
import { AdminPage } from "@/components/admin/AdminLayout";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminRejectDialog } from "@/components/admin/AdminRejectDialog";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminDetailSkeleton } from "@/components/admin/AdminSkeletons";
import { AccountBadge } from "@/components/admin/AdminBadge";
import { Field, FieldGroup } from "@/components/admin/AdminParts";
import { roleLabel } from "@/components/admin/labels";
import { ReviewActivity, ReviewNotes, useReviewRecords } from "@/components/admin/LiveReviewRecords";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/users/$id")({ pendingComponent: () => <AdminDetailSkeleton label="Loading user" />, ...pending, component: AdminUserDetail });

const roles: { value: UserRole; icon: typeof Users; description: string }[] = [
  { value: "donor", icon: HeartHandshake, description: "Gives to campaigns and follows updates." },
  { value: "org_admin", icon: Building2, description: "Runs an organization's profile, campaigns and payouts." },
  { value: "platform_admin", icon: ShieldCheck, description: "Full access to this admin, including verification." },
];
type Tab = "overview" | "activity" | "notes";
type UserDetail = User & { donations: Array<{ id: string; amount: number; date: string; campaign: { id: string; title: string } }>; campaigns: Array<{ id: string; title: string }> };

function AdminUserDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [suspending, setSuspending] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [changingRole, setChangingRole] = useState(false);
  const [role, setRole] = useState<UserRole>("donor");
  const userQuery = useQuery({ queryKey: ["admin", "user", id], queryFn: () => apiFetch<UserDetail>(`/admin/review/users/${id}`) });
  const reviewRecords = useReviewRecords("user", id);
  const refresh = () => Promise.all([queryClient.invalidateQueries({ queryKey: ["admin", "user", id] }), queryClient.invalidateQueries({ queryKey: ["admin", "users"] }), queryClient.invalidateQueries({ queryKey: ["admin", "activity"] })]);
  const status = useMutation({ mutationFn: ({ next, reason }: { next: "active" | "suspended"; reason?: string }) => apiFetch(`/admin/review/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: next, ...(reason ? { reason } : {}) }) }), onSuccess: refresh, onError: (error) => toast.error(error instanceof Error ? error.message : "Could not update this user.") });
  const roleUpdate = useMutation({ mutationFn: (next: UserRole) => apiFetch(`/admin/review/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role: next }) }), onSuccess: refresh, onError: (error) => toast.error(error instanceof Error ? error.message : "Could not update this role.") });

  if (userQuery.isLoading) return <AdminDetailSkeleton label="Loading user" />;
  if (userQuery.error) {
    const missing = userQuery.error instanceof ApiError && userQuery.error.status === 404;
    return <AdminPage title={missing ? "User not found" : "Could not load user"} crumbs={[{ label: "Users", to: "/admin/users", search: { view: "all" } }]}><AdminEmptyState icon={<Users className="h-5 w-5" strokeWidth={1.75} />} title={missing ? "This user doesn't exist" : "The user record is unavailable"} description={missing ? "They may have deleted their account, or the link is wrong." : "Try refreshing the record or return to the user list."} action={<Link to="/admin/users" search={{ view: "all" }} className={btn("secondary", "sm")}>Back to users</Link>} /></AdminPage>;
  }

  const user = userQuery.data!;
  const isMe = user.id === currentUser?.id;
  const suspendBlock = isMe ? "You can't suspend your own account." : user.role === "platform_admin" ? "Platform admins can't be suspended. Change their role first." : undefined;
  const checks = [{ label: "Email", ok: user.emailVerified, icon: Mail }, { label: "Phone", ok: user.phoneVerified, icon: Phone }, { label: "BVN", ok: user.bvnVerified, icon: ShieldCheck }];

  return <AdminPage crumbs={[{ label: "Users", to: "/admin/users", search: { view: "all" } }, { label: user.name }]} title={<span className="flex items-center gap-3"><img src={user.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" /><span className="min-w-0">{user.name}{isMe ? <span className="ml-2 font-gsf text-[15px] text-muted-ink">(you)</span> : null}</span></span>} lead={<span className="flex flex-wrap items-center gap-x-3 gap-y-1.5"><AccountBadge status={user.status} /><span>{roleLabel[user.role]}</span><span aria-hidden className="hidden sm:inline">·</span><span>Joined {new Date(user.joinedAt).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}</span></span>} dock actions={<div className="flex flex-col gap-1.5 sm:items-end"><div className="flex flex-wrap gap-2"><button type="button" disabled={isMe} title={isMe ? "You can't change your own role." : undefined} className={btn("secondary")} onClick={() => { setRole(user.role); setChangingRole(true); }}><UserCog className="h-4 w-4" strokeWidth={1.75} /> Change role</button>{user.status === "suspended" ? <button type="button" className={btn("primary")} onClick={() => setReactivating(true)}>Reactivate</button> : <button type="button" disabled={Boolean(suspendBlock)} title={suspendBlock} className={cn(btn("secondary"), "text-danger hover:border-danger")} onClick={() => setSuspending(true)}>Suspend</button>}</div>{suspendBlock && user.status === "active" ? <p className="text-[12px] text-muted-ink">{suspendBlock}</p> : null}</div>}>
    {user.suspendReason ? <div className="flex flex-col gap-1 rounded-field border border-danger/20 bg-danger/[0.04] p-4"><p className="text-sm font-medium text-danger">Suspended{user.suspendedAt ? ` since ${user.suspendedAt}` : ""}</p><p className="text-sm text-ink-soft">{user.suspendReason}</p></div> : null}
    <div className="grid overflow-hidden rounded-card border border-line-soft lg:grid-cols-[300px_minmax(0,1fr)]"><aside className="border-b border-line-soft bg-panel/40 px-3 py-2 sm:px-4 lg:border-b-0 lg:border-r"><FieldGroup title="Contact"><Field icon={Mail} label="Email" copy={user.email}>{user.email}</Field><Field icon={Phone} label="Phone" copy={user.phone || undefined}>{user.phone || "—"}</Field></FieldGroup><FieldGroup title="Account"><Field icon={UserCog} label="Role">{roleLabel[user.role]}</Field><Field icon={Calendar} label="Joined">{user.joinedAt}</Field><Field icon={Fingerprint} label="ID" copy={user.id}>{user.id}</Field></FieldGroup><FieldGroup title="Identity checks">{checks.map((check) => <Field key={check.label} icon={check.icon} label={check.label}>{check.ok ? <span className="inline-flex items-center gap-1 text-verified-ink"><BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} /> Confirmed</span> : <span className="inline-flex items-center gap-1 text-muted-ink"><CircleDashed className="h-3.5 w-3.5" strokeWidth={2} /> Not confirmed</span>}</Field>)}</FieldGroup></aside><div className="min-w-0 px-4 pb-6 pt-4 sm:px-6"><Tabs className="-mx-4 px-4" value={tab} onChange={setTab} items={[{ value: "overview", label: "Overview" }, { value: "activity", label: "Activity" }, { value: "notes", label: "Notes", count: reviewRecords.data?.total ?? 0 }]} /><div key={tab} className="admin-rise pt-5">{tab === "overview" ? <dl className="grid divide-y divide-line-soft rounded-field border border-line-soft sm:grid-cols-3 sm:divide-x sm:divide-y-0">{[{ label: "Total given", value: formatMoney(user.totalGiven) }, { label: "Gifts made", value: user.donationsCount.toLocaleString() }, { label: "Campaigns started", value: user.campaignsCreated.toString() }].map((stat) => <div key={stat.label} className="p-4"><dt className="text-[13px] text-muted-ink">{stat.label}</dt><dd className="mt-1.5 font-display text-[22px] leading-none text-ink">{stat.value}</dd></div>)}</dl> : null}{tab === "activity" ? <ReviewActivity entityType="user" id={id} /> : null}{tab === "notes" ? <ReviewNotes entityType="user" id={id} /> : null}</div></div></div>
    <AdminRejectDialog open={suspending} onOpenChange={setSuspending} title={`Suspend ${user.name}?`} description="They can't sign in or give until you reactivate them. Their past gifts stay as they are." confirmLabel="Suspend" reasons={["Suspicious payment activity", "Reported by an organization", "Fake or duplicate account"]} onReject={async (reason, notify) => { await status.mutateAsync({ next: "suspended", reason }); setSuspending(false); toast.success(`${user.name} was suspended${notify ? ". We've emailed them" : ""}`); }} />
    <AdminConfirmDialog open={reactivating} onOpenChange={setReactivating} title={`Reactivate ${user.name}?`} consequences={["They can sign in and give again straight away.", "We email them to say they're back."]} confirmLabel="Reactivate" onConfirm={async () => { await status.mutateAsync({ next: "active" }); setReactivating(false); toast.success(`${user.name} was reactivated`); }} />
    <AdminConfirmDialog open={changingRole} onOpenChange={setChangingRole} title={`Change ${user.name}'s role`} description="Roles decide what they can see and do on AzarFaith." confirmLabel="Update role" confirmDisabled={role === user.role} onConfirm={async () => { await roleUpdate.mutateAsync(role); setChangingRole(false); toast.success(`${user.name} is now ${roleLabel[role].toLowerCase()}`); }}><div className="flex flex-col gap-2">{roles.map((option) => <ChoiceCard key={option.value} selected={role === option.value} onClick={() => setRole(option.value)} icon={<option.icon className="h-5 w-5" strokeWidth={1.5} />} title={option.value === user.role ? `${roleLabel[option.value]} (current)` : roleLabel[option.value]} description={option.description} />)}</div></AdminConfirmDialog>
  </AdminPage>;
}
