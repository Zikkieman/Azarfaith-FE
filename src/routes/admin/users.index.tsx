import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Download, Mail, Phone, ShieldCheck, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { type User } from "@/lib/domain";
import { matches, type FilterValue } from "@/lib/admin";
import { apiFetch, pending } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { btn } from "@/components/app/btn";
import { AdminPage } from "@/components/admin/AdminLayout";
import { FilterChips, FilterMenu, SearchField, Segmented, type FilterField } from "@/components/admin/AdminFilterBar";
import { AdminTable, type BulkAction, type Column } from "@/components/admin/AdminTable";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminRejectDialog } from "@/components/admin/AdminRejectDialog";
import { AdminListSkeleton } from "@/components/admin/AdminSkeletons";
import { AccountBadge } from "@/components/admin/AdminBadge";
import { roleLabel } from "@/components/admin/labels";
import { downloadCsv } from "@/components/admin/csv";
import { cn } from "@/lib/utils";

const views = ["all", "donor", "org_admin", "platform_admin", "suspended"] as const;
type View = (typeof views)[number];

export const Route = createFileRoute("/admin/users/")({
  validateSearch: (search: Record<string, unknown>): { view: View } => ({ view: views.includes(search.view as View) ? (search.view as View) : "all" }),
  pendingComponent: () => <AdminListSkeleton label="Loading users" />,
  ...pending,
  head: () => ({ meta: [{ title: "Users — AzarFaith admin" }] }),
  component: AdminUsers,
});

const fields: FilterField[] = [{ key: "missing", label: "Missing check", icon: ShieldCheck, options: [{ value: "email", label: "Email" }, { value: "phone", label: "Phone" }, { value: "bvn", label: "BVN" }] }];
const formatMoney = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;
const missing = (user: User) => [!user.emailVerified && "email", !user.phoneVerified && "phone", !user.bvnVerified && "bvn"].filter(Boolean) as string[];

function CheckMarks({ user }: { user: User }) {
  const marks = [{ ok: user.emailVerified, icon: Mail, label: "Email" }, { ok: user.phoneVerified, icon: Phone, label: "Phone" }, { ok: user.bvnVerified, icon: ShieldCheck, label: "BVN" }];
  return <span className="inline-flex items-center gap-1">{marks.map((mark) => <span key={mark.label} title={`${mark.label} ${mark.ok ? "confirmed" : "not confirmed"}`} className={cn("grid h-6 w-6 place-items-center rounded-[6px]", mark.ok ? "bg-verified/10 text-verified-ink" : "bg-panel text-subtle")}><mark.icon className="h-3.5 w-3.5" strokeWidth={1.75} /></span>)}</span>;
}

function AdminUsers() {
  const { view } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const usersQuery = useQuery({ queryKey: ["admin", "users"], queryFn: () => apiFetch<User[]>("/admin/review/users") });
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterValue>({});
  const [bulkSuspend, setBulkSuspend] = useState<User[] | null>(null);
  const status = useMutation({
    mutationFn: ({ selected, reason }: { selected: User[]; reason: string }) => Promise.all(selected.map((user) => apiFetch(`/admin/review/users/${user.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "suspended", reason }) }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not suspend the selected users."),
  });

  if (usersQuery.isLoading) return <AdminListSkeleton label="Loading users" />;
  if (usersQuery.error) throw usersQuery.error;
  const users = usersQuery.data ?? [];
  const count = (target: View) => target === "all" ? users.length : target === "suspended" ? users.filter((user) => user.status === "suspended").length : users.filter((user) => user.role === target).length;
  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => (view === "all" || (view === "suspended" ? user.status === "suspended" : user.role === view)) && (!filters.missing?.length || missing(user).some((item) => matches(filters, "missing", item))) && (!query || [user.name, user.email, user.phone].some((item) => item.toLowerCase().includes(query))));
  }, [users, view, filters, search]);
  const columns: Column<User>[] = [
    { key: "name", header: "Name", sortValue: (user) => user.name, cell: (user) => <div className="flex items-center gap-3"><img src={user.avatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" /><div className="min-w-0"><p className="flex items-center gap-1.5 truncate font-medium text-ink">{user.name}{user.id === currentUser?.id ? <span className="text-[12px] font-normal text-muted-ink">(you)</span> : null}</p><p className="truncate text-[12px] text-muted-ink">{user.email}</p></div></div> },
    { key: "role", header: "Role", className: "hidden md:table-cell", sortValue: (user) => roleLabel[user.role], cell: (user) => <span className="text-ink-soft">{roleLabel[user.role]}</span> },
    { key: "status", header: "Status", cell: (user) => <AccountBadge status={user.status} /> },
    { key: "checks", header: "Checks", className: "hidden lg:table-cell", cell: (user) => <CheckMarks user={user} /> },
    { key: "given", header: "Given", align: "right", sortValue: (user) => user.totalGiven, cell: (user) => user.totalGiven ? <span className="text-ink">{formatMoney(user.totalGiven)}</span> : <span className="text-subtle">—</span> },
    { key: "joined", header: "Joined", className: "hidden xl:table-cell", sortValue: (user) => user.joinedAt, cell: (user) => <span className="text-ink-soft">{new Date(user.joinedAt).toLocaleDateString("en-NG", { month: "short", year: "numeric" })}</span> },
  ];
  const bulk = (selected: User[]): BulkAction[] => {
    const active = selected.filter((user) => user.status === "active");
    const protectedUsers = active.filter((user) => user.role === "platform_admin" || user.id === currentUser?.id);
    return [
      ...(active.length ? [{ label: "Suspend", icon: UserX, tone: "danger" as const, onSelect: () => setBulkSuspend(active), disabledReason: protectedUsers.length ? "Platform admins, including you, can't be suspended" : undefined }] : []),
      { label: "Export", icon: Download, onSelect: () => { downloadCsv("users.csv", ["Name", "Email", "Phone", "Role", "Status", "Given"], selected.map((user) => [user.name, user.email, user.phone, roleLabel[user.role], user.status, String(user.totalGiven)])); toast(`Exported ${selected.length} user${selected.length === 1 ? "" : "s"}`); } },
    ];
  };
  const hasFilters = Boolean(search || filters.missing?.length);

  return <AdminPage title="Users" count={rows.length} lead="Everyone with an AzarFaith account." crumbs={[{ label: "Users" }]}>
    <div className="flex flex-col gap-3"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><Segmented value={view} onChange={(next) => navigate({ to: "/admin/users", search: { view: next } })} items={[{ value: "all", label: "All", count: count("all") }, { value: "donor", label: "Givers", count: count("donor") }, { value: "org_admin", label: "Organization admins", count: count("org_admin") }, { value: "platform_admin", label: "Platform admins", count: count("platform_admin") }, { value: "suspended", label: "Suspended", count: count("suspended") }]} /><div className="flex items-center gap-2"><div className="flex-1 sm:flex-none"><SearchField value={search} onChange={setSearch} placeholder="Name, email or phone" /></div><FilterMenu fields={fields} value={filters} onChange={setFilters} /></div></div><FilterChips fields={fields} value={filters} onChange={setFilters} /></div>
    <AdminTable label="Users" noun={["user", "users"]} rows={rows} columns={columns} onRowClick={(user) => navigate({ to: "/admin/users/$id", params: { id: user.id } })} bulkActions={bulk} mobileRow={(user) => <div className="flex items-center gap-3"><img src={user.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{user.name}</p><p className="truncate text-[12px] text-muted-ink">{roleLabel[user.role]}, {user.email}</p></div><AccountBadge status={user.status} /></div>} empty={<AdminEmptyState icon={view === "suspended" ? <BadgeCheck className="h-5 w-5" strokeWidth={1.75} /> : <Users className="h-5 w-5" strokeWidth={1.75} />} title={hasFilters ? "No users match" : view === "suspended" ? "No one is suspended" : "No users here"} description={hasFilters ? "Nothing fits this search and these filters." : view === "suspended" ? "Suspended accounts show up here with the reason." : "No one has this role yet."} action={hasFilters ? <button type="button" className={btn("secondary", "sm")} onClick={() => { setSearch(""); setFilters({}); }}>Clear search and filters</button> : undefined} />} />
    <AdminRejectDialog open={Boolean(bulkSuspend)} onOpenChange={(open) => !open && setBulkSuspend(null)} title={`Suspend ${bulkSuspend?.length ?? 0} user${(bulkSuspend?.length ?? 0) === 1 ? "" : "s"}?`} description={`${bulkSuspend?.map((user) => user.name).join(", ")}. They can't sign in or give until reactivated.`} confirmLabel="Suspend" notifyLabel="Email them the reason" onReject={async (reason) => { if (!bulkSuspend?.length) return; await status.mutateAsync({ selected: bulkSuspend, reason }); setBulkSuspend(null); toast.success(`${bulkSuspend.length} user${bulkSuspend.length === 1 ? "" : "s"} suspended`); }} />
  </AdminPage>;
}
