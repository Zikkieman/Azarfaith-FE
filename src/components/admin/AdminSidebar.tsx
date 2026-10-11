import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Building2,
  History,
  Home,
  Megaphone,
  Settings2,
  Users,
  Wallet,
} from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import { getAdminDashboard } from "@/features/catalog/api";
import { cn } from "@/lib/utils";
import logoMark from "@/assets/signup/logo-mark.svg";
import { LogoutButton } from "@/components/LogoutButton";
import { useSidebar } from "./AdminNavigationContext";

const groups = [
  { label: "Workspace", items: [{ label: "Overview", icon: Home, to: "/admin" }] },
  {
    label: "Review & directory",
    items: [
      { label: "Organizations", icon: Building2, to: "/admin/orgs" },
      { label: "Campaigns", icon: Megaphone, to: "/admin/campaigns" },
      { label: "Users", icon: Users, to: "/admin/users" },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Payouts", icon: Wallet, to: "/admin/payouts" },
      { label: "Activity log", icon: History, to: "/admin/activity" },
      { label: "Settings", icon: Settings2, to: "/admin/settings" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname.replace(/\/$/, ""),
  });
  const { setOpen } = useSidebar();
  const user = useAppSelector((state) => state.auth.user);
  const dashboard = useQuery({ queryKey: ["admin", "dashboard"], queryFn: getAdminDashboard });
  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-line-soft bg-panel">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <img src={logoMark} alt="" className="h-8 w-8" />
        <span className="text-[15px] font-semibold">AzarFaith</span>
        <span className="rounded-md bg-ink/5 px-2 py-0.5 text-[11px] text-muted-ink">Admin</span>
      </div>
      <nav aria-label="Admin navigation" className="flex-1 space-y-6 overflow-y-auto px-3 py-3">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-xs text-muted-ink">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active =
                  item.to === "/admin"
                    ? pathname === item.to
                    : pathname === item.to || pathname.startsWith(`${item.to}/`);
                const count =
                  item.to === "/admin/orgs"
                    ? dashboard.data?.pendingOrganizations
                    : item.to === "/admin/campaigns"
                      ? dashboard.data?.pendingCampaigns
                      : undefined;
                return (
                  <Link
                    key={item.to}
                    to={item.to as "/admin"}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-paper font-medium shadow-sm ring-1 ring-line-soft"
                        : "text-ink-soft hover:bg-paper/70",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    <span className="flex-1">{item.label}</span>
                    {!!count && (
                      <span
                        title="Awaiting review"
                        className="rounded-md bg-brand/10 px-1.5 text-xs tabular-nums text-brand-ink"
                      >
                        {count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="space-y-3 border-t border-line-soft p-4">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-ink">
          <ArrowUpRight className="h-4 w-4" />
          View website
        </Link>
        <Link to="/admin/profile" className="block rounded-lg p-2 hover:bg-paper">
          <p className="truncate text-sm font-medium">{user?.fullName}</p>
          <p className="text-xs text-muted-ink">Your admin profile</p>
        </Link>
        <LogoutButton to="/admin/login" className="text-sm text-muted-ink" />
      </div>
    </aside>
  );
}
