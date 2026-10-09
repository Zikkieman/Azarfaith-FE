import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Download, Mail, Phone, ShieldCheck, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { formatMoney, type User } from "@/lib/mock";
import { matches, type FilterValue } from "@/lib/admin";
import { pending, simulateNetwork } from "@/lib/api";
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
import { AdminRejectDialog } from "@/components/admin/AdminRejectDialog";
import { AdminListSkeleton } from "@/components/admin/AdminSkeletons";
import { AccountBadge } from "@/components/admin/AdminBadge";
import { roleLabel } from "@/components/admin/labels";
import { downloadCsv } from "@/components/admin/csv";
import { cn } from "@/lib/utils";

const views = ["all", "donor", "org_admin", "platform_admin", "suspended"] as const;
type View = (typeof views)[number];

export const Route = createFileRoute("/admin/users/")({
  validateSearch: (s: Record<string, unknown>): { view: View } => ({
    view: views.includes(s.view as View) ? (s.view as View) : "all",
  }),
  loader: () => simulateNetwork(),
  pendingComponent: () => <AdminListSkeleton label="Loading users" />,
  ...pending,
  head: () => ({ meta: [{ title: "Users — AzarFaith admin" }] }),
  component: AdminUsers,
});

const ME = "u1";

const fields: FilterField[] = [
  {
    key: "missing",
    label: "Missing check",
    icon: ShieldCheck,
    options: [
      { value: "email", label: "Email" },
      { value: "phone", label: "Phone" },
      { value: "bvn", label: "BVN" },
    ],
  },
];

const missing = (u: User) =>
  [!u.emailVerified && "email", !u.phoneVerified && "phone", !u.bvnVerified && "bvn"].filter(
    Boolean,
  ) as string[];

/** Email, phone and BVN as three small marks: filled when confirmed. */
function CheckMarks({ user }: { user: User }) {
  const marks = [
    { ok: user.emailVerified, icon: Mail, label: "Email" },
    { ok: user.phoneVerified, icon: Phone, label: "Phone" },
    { ok: user.bvnVerified, icon: ShieldCheck, label: "BVN" },
  ];
  return (
    <span className="inline-flex items-center gap-1">
      {marks.map((m) => (
        <span
          key={m.label}
          title={`${m.label} ${m.ok ? "confirmed" : "not confirmed"}`}
          className={cn(
            "grid h-6 w-6 place-items-center rounded-[6px]",
            m.ok ? "bg-verified/10 text-verified-ink" : "bg-panel text-subtle",
          )}
        >
          <m.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
      ))}
    </span>
  );
}

function AdminUsers() {
  const { view } = Route.useSearch();
  const navigate = useNavigate();
  const users = useApp((s) => s.users);
  const suspendUser = useApp((s) => s.suspendUser);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterValue>({});
  const [bulkSuspend, setBulkSuspend] = useState<User[] | null>(null);

  const count = (v: View) =>
    v === "all"
      ? users.length
      : v === "suspended"
        ? users.filter((u) => u.status === "suspended").length
        : users.filter((u) => u.role === v).length;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (view === "all" || (view === "suspended" ? u.status === "suspended" : u.role === view)) &&
        (!filters.missing?.length || missing(u).some((m) => matches(filters, "missing", m))) &&
        (!q || [u.name, u.email, u.phone].some((x) => x.toLowerCase().includes(q))),
    );
  }, [users, view, filters, search]);

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (u) => u.name,
      cell: (u) => (
        <div className="flex items-center gap-3">
          <img src={u.avatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate font-medium text-ink">
              {u.name}
              {u.id === ME ? (
                <span className="text-[12px] font-normal text-muted-ink">(you)</span>
              ) : null}
            </p>
            <p className="truncate text-[12px] text-muted-ink">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      className: "hidden md:table-cell",
      sortValue: (u) => roleLabel[u.role],
      cell: (u) => <span className="text-ink-soft">{roleLabel[u.role]}</span>,
    },
    { key: "status", header: "Status", cell: (u) => <AccountBadge status={u.status} /> },
    {
      key: "checks",
      header: "Checks",
      className: "hidden lg:table-cell",
      cell: (u) => <CheckMarks user={u} />,
    },
    {
      key: "given",
      header: "Given",
      align: "right",
      sortValue: (u) => u.totalGiven,
      cell: (u) =>
        u.totalGiven ? (
          <span className="text-ink">{formatMoney(u.totalGiven)}</span>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "joined",
      header: "Joined",
      className: "hidden xl:table-cell",
      sortValue: (u) => u.joinedAt,
      cell: (u) => (
        <span className="text-ink-soft">
          {new Date(u.joinedAt).toLocaleDateString("en-NG", { month: "short", year: "numeric" })}
        </span>
      ),
    },
  ];

  const bulk = (selected: User[]): BulkAction[] => {
    const active = selected.filter((u) => u.status === "active");
    const protectedOnes = active.filter((u) => u.role === "platform_admin" || u.id === ME);
    return [
      ...(active.length
        ? [
            {
              label: "Suspend",
              icon: UserX,
              tone: "danger" as const,
              onSelect: () => setBulkSuspend(active),
              disabledReason: protectedOnes.length
                ? "Platform admins, including you, can't be suspended"
                : undefined,
            },
          ]
        : []),
      {
        label: "Export",
        icon: Download,
        onSelect: () => {
          downloadCsv(
            "users.csv",
            ["Name", "Email", "Phone", "Role", "Status", "Given"],
            selected.map((u) => [
              u.name,
              u.email,
              u.phone,
              roleLabel[u.role],
              u.status,
              String(u.totalGiven),
            ]),
          );
          toast(`Exported ${selected.length} user${selected.length > 1 ? "s" : ""}`);
        },
      },
    ];
  };

  const hasFilters = Boolean(search || filters.missing?.length);

  return (
    <AdminPage
      title="Users"
      count={rows.length}
      lead="Everyone with an AzarFaith account."
      crumbs={[{ label: "Users" }]}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Segmented
            value={view}
            onChange={(v) => navigate({ to: "/admin/users", search: { view: v } })}
            items={[
              { value: "all", label: "All", count: count("all") },
              { value: "donor", label: "Givers", count: count("donor") },
              { value: "org_admin", label: "Organization admins", count: count("org_admin") },
              { value: "platform_admin", label: "Platform admins", count: count("platform_admin") },
              { value: "suspended", label: "Suspended", count: count("suspended") },
            ]}
          />
          <div className="flex items-center gap-2">
            <div className="flex-1 sm:flex-none">
              <SearchField value={search} onChange={setSearch} placeholder="Name, email or phone" />
            </div>
            <FilterMenu fields={fields} value={filters} onChange={setFilters} />
          </div>
        </div>
        <FilterChips fields={fields} value={filters} onChange={setFilters} />
      </div>

      <AdminTable
        label="Users"
        noun={["user", "users"]}
        rows={rows}
        columns={columns}
        onRowClick={(u) => navigate({ to: "/admin/users/$id", params: { id: u.id } })}
        bulkActions={bulk}
        mobileRow={(u) => (
          <div className="flex items-center gap-3">
            <img src={u.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{u.name}</p>
              <p className="truncate text-[12px] text-muted-ink">
                {roleLabel[u.role]}, {u.email}
              </p>
            </div>
            <AccountBadge status={u.status} />
          </div>
        )}
        empty={
          hasFilters ? (
            <AdminEmptyState
              icon={<Users className="h-5 w-5" strokeWidth={1.75} />}
              title="No users match"
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
          ) : (
            <AdminEmptyState
              icon={
                view === "suspended" ? (
                  <BadgeCheck className="h-5 w-5" strokeWidth={1.75} />
                ) : (
                  <Users className="h-5 w-5" strokeWidth={1.75} />
                )
              }
              title={view === "suspended" ? "No one is suspended" : "No users here"}
              description={
                view === "suspended"
                  ? "Suspended accounts show up here with the reason."
                  : "No one has this role yet."
              }
            />
          )
        }
      />

      <AdminRejectDialog
        open={Boolean(bulkSuspend)}
        onOpenChange={(v) => !v && setBulkSuspend(null)}
        title={`Suspend ${bulkSuspend?.length ?? 0} user${(bulkSuspend?.length ?? 0) > 1 ? "s" : ""}?`}
        description={`${bulkSuspend?.map((u) => u.name).join(", ")}. They can't sign in or give until reactivated.`}
        confirmLabel="Suspend"
        notifyLabel="Email them the reason"
        onReject={(reason) => {
          bulkSuspend?.forEach((u) => suspendUser(u.id, reason));
          toast(`${bulkSuspend?.length} suspended`);
        }}
      />
    </AdminPage>
  );
}
