import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Building2,
  Megaphone,
  Users,
  Settings,
  ArrowLeft,
  Shield,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAdminDashboard } from "@/features/catalog/api";
import { useSidebar } from "./AdminLayout";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/admin" as const },
  { label: "Organizations", icon: Building2, to: "/admin/orgs" as const },
  { label: "Campaigns", icon: Megaphone, to: "/admin/campaigns" as const },
  { label: "Users", icon: Users, to: "/admin/users" as const },
  { label: "Settings", icon: Settings, to: "/admin/settings" as const },
];

export function AdminSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { setOpen } = useSidebar();
  const isClient = typeof window !== "undefined";
  const { data } = useQuery({
    queryKey: ["admin", "dashboard", "sidebar"],
    queryFn: getAdminDashboard,
    enabled: isClient,
  });

  const handleNavClick = () => setOpen(false);

  return (
    <aside className="flex h-screen w-60 flex-col bg-gray-950 lg:fixed lg:inset-y-0 lg:left-0">
      <div className="flex h-16 items-center justify-between border-b border-gray-800 px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold text-white">AzarFaith</span>
          <span className="ml-1 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
            ADMIN
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.to === "/admin" ? pathname === "/admin" : pathname.startsWith(`${item.to}`);

          const badge =
            item.to === "/admin/orgs"
              ? (data?.pendingOrganizations ?? 0)
              : item.to === "/admin/campaigns"
                ? (data?.pendingCampaigns ?? 0)
                : 0;

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-amber-500/10 text-amber-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 p-3">
        <Link
          to="/"
          onClick={handleNavClick}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Site</span>
        </Link>
      </div>
    </aside>
  );
}
