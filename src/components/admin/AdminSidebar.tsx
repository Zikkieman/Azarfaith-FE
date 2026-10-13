import { Link, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  ChevronsUpDown,
  History,
  Home,
  LogOut,
  Megaphone,
  Search,
  Settings2,
  ShieldAlert,
  Users,
  Wallet,
} from "lucide-react";
import logoMark from "@/assets/signup/logo-mark.svg";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/app/hooks";
import { getAdminDashboard } from "@/features/catalog/api";
import { adminApiFetch } from "@/lib/api";
import type { DirectoryPage } from "@/lib/admin-directory";
import { UserAvatar } from "@/components/UserAvatar";
import { LogoutButton } from "@/components/LogoutButton";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePalette } from "./AdminNavigationContext";

type Item = {
  label: string;
  icon: LucideIcon;
  to: string;
  view?: string;
  count?: number;
  attention?: boolean;
};

/**
 * Light sidebar (after Plain and Cloudflare): search on top, then nav grouped by job. The two
 * review queues sit first and carry their live counts.
 */
export function AdminSidebar() {
  const location = useRouterState({ select: (s) => s.location });
  const { setPaletteOpen } = usePalette();
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === "platform_admin";
  const dashboard = useQuery({ queryKey: ["admin", "dashboard"], queryFn: getAdminDashboard });
  const users = useQuery({
    enabled: isAdmin,
    queryKey: ["admin", "suspended-count", user?.id],
    queryFn: () =>
      adminApiFetch<DirectoryPage>(
        "/admin/review/directory/user?status=SUSPENDED&pageSize=1&page=1",
      ),
    staleTime: 30000,
  });
  const pendingOrgs = dashboard.data?.pendingOrganizations,
    pendingCampaigns = dashboard.data?.pendingCampaigns,
    suspended = users.data?.total;

  if (!isAdmin) return null;
  const groups: { label?: string; items: Item[] }[] = [
    { items: [{ label: "Overview", icon: Home, to: "/admin" }] },
    {
      label: "Review",
      items: [
        {
          label: "Verify organizations",
          icon: BadgeCheck,
          to: "/admin/orgs",
          view: "pending",
          count: pendingOrgs,
          attention: true,
        },
        {
          label: "Review campaigns",
          icon: ShieldAlert,
          to: "/admin/campaigns",
          view: "pending",
          count: pendingCampaigns,
          attention: true,
        },
      ],
    },
    {
      label: "Directory",
      items: [
        { label: "Organizations", icon: Building2, to: "/admin/orgs", view: "all" },
        { label: "Campaigns", icon: Megaphone, to: "/admin/campaigns", view: "all" },
        { label: "Users", icon: Users, to: "/admin/users", count: suspended || undefined },
      ],
    },
    {
      label: "Platform",
      items: [
        { label: "Activity log", icon: History, to: "/admin/activity" },
        { label: "Payouts", icon: Wallet, to: "/admin/payouts" },
        { label: "Settings", icon: Settings2, to: "/admin/settings" },
      ],
    },
  ];

  const view = (location.search as { view?: string }).view;
  const isActive = (item: Item) => {
    const path = location.pathname.replace(/\/$/, "");
    if (item.to === "/admin") return path === "/admin";
    if (!(path === item.to || path.startsWith(item.to + "/"))) return false;
    // On list pages the view decides between "Verify organizations" and "Organizations".
    if (item.view && path === item.to) {
      return item.view === "pending" ? view === "pending" : view !== "pending";
    }
    return item.view !== "pending";
  };

  return (
    <aside className="flex h-full flex-col border-r border-line-soft bg-panel font-gsf">
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
        <img src={logoMark} alt="" className="h-7 w-7" />
        <span className="text-[15px] font-semibold text-ink">AzarFaith</span>
        <span className="rounded-[6px] bg-ink/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-ink-soft">
          Admin
        </span>
      </div>

      <div className="px-3 pb-2">
        <button
          type="button"
          aria-label="Search"
          onClick={() => setPaletteOpen(true)}
          className="flex h-9 w-full items-center gap-2 rounded-[10px] border border-line-soft bg-paper px-2.5 text-sm text-muted-ink transition-colors hover:border-line-input hover:text-ink"
        >
          <Search className="h-4 w-4" strokeWidth={1.75} />
          <span className="flex-1 text-left">Search</span>
          <kbd className="rounded-[5px] border border-line-soft bg-panel px-1.5 font-gsf text-[11px] text-muted-ink">
            ⌘K
          </kbd>
        </button>
      </div>

      <nav
        aria-label="Admin navigation"
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-2"
      >
        {groups.map((g, gi) => (
          <div key={gi} className="flex flex-col gap-0.5">
            {g.label ? (
              <p className="px-2.5 pb-1 text-[12px] font-medium text-subtle">{g.label}</p>
            ) : null}
            {g.items.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.label}
                  aria-current={active ? "page" : undefined}
                  to={item.to as "/admin"}
                  search={item.view ? ({ view: item.view } as never) : undefined}
                  className={cn(
                    "flex h-8 items-center gap-2.5 rounded-[8px] px-2.5 text-[14px] transition-colors duration-150",
                    active
                      ? "bg-paper font-medium text-ink shadow-[0_1px_2px_rgba(19,14,48,0.08)] ring-1 ring-line-soft"
                      : "text-ink-soft hover:bg-paper/70 hover:text-ink",
                  )}
                >
                  <item.icon
                    className={cn("h-4 w-4 shrink-0", active ? "text-ink" : "text-muted-ink")}
                    strokeWidth={1.75}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.count ? (
                    <span
                      className={cn(
                        "min-w-5 rounded-[6px] px-1.5 text-center text-[12px] font-medium tabular-nums",
                        item.attention ? "bg-brand/10 text-brand-ink" : "text-muted-ink",
                      )}
                    >
                      {item.count}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-line-soft p-3">
        <Link
          to="/"
          className="flex h-8 items-center gap-2.5 rounded-[8px] px-2.5 text-[14px] text-ink-soft transition-colors hover:bg-paper/70 hover:text-ink"
        >
          <ArrowUpRight className="h-4 w-4 text-muted-ink" strokeWidth={1.75} />
          View website
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left outline-none transition-colors hover:bg-paper/70 focus-visible:ring-2 focus-visible:ring-ink">
            <UserAvatar src={user?.avatarUrl} name={user?.fullName} className="h-7 w-7" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">
                {user?.fullName}
              </span>
              <span className="block text-[12px] text-muted-ink">Platform admin</span>
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-ink" strokeWidth={2} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="designer-app w-56 rounded-field border border-line-soft bg-paper p-1.5 font-gsf shadow-[0_16px_48px_-16px_rgba(19,14,48,0.25)]"
          >
            <DropdownMenuItem
              asChild
              className="cursor-pointer rounded-[8px] px-3 py-2 text-sm focus:bg-panel"
            >
              <Link to="/admin/profile">Your profile</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-line-soft" />
            <DropdownMenuItem asChild>
              <LogoutButton
                to="/admin/login"
                icon={<LogOut className="h-4 w-4" strokeWidth={1.75} />}
                className="flex w-full cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 text-sm focus:bg-panel"
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
