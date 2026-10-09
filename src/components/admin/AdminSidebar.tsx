import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, Building2, LayoutGrid, Megaphone, Settings2, Users } from "lucide-react";
import logo from "@/assets/landing/logo.svg";
import { useApp } from "@/lib/store";
import { me } from "@/lib/mock";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", icon: LayoutGrid, to: "/admin" as const },
  { label: "Organizations", icon: Building2, to: "/admin/orgs" as const },
  { label: "Campaigns", icon: Megaphone, to: "/admin/campaigns" as const },
  { label: "Users", icon: Users, to: "/admin/users" as const },
  { label: "Settings", icon: Settings2, to: "/admin/settings" as const },
];

/** Black sidebar, matching the site and app navs. Pending counts sit beside their section. */
export function AdminSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const pendingOrgs = useApp(
    (s) => s.orgs.filter((o) => o.verificationStatus === "pending").length,
  );
  const pendingCampaigns = useApp(
    (s) => s.campaigns.filter((c) => c.verificationStatus === "pending").length,
  );
  const counts: Record<string, number> = {
    "/admin/orgs": pendingOrgs,
    "/admin/campaigns": pendingCampaigns,
  };

  return (
    <aside className="flex h-full flex-col bg-black px-3 pb-4 pt-5 font-gsf text-white">
      <div className="flex items-center gap-2.5 px-3 pb-8">
        <img src={logo} alt="AzarFaith" className="h-[22px] w-auto" />
        <span className="text-[13px] text-white/50">Admin</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {navItems.map((item) => {
          const active =
            item.to === "/admin"
              ? path === "/admin" || path === "/admin/"
              : path === item.to || path.startsWith(`${item.to}/`);
          const count = counts[item.to] ?? 0;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group relative flex h-10 items-center gap-3 rounded-field px-3 text-[14px] font-medium transition-colors duration-200",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand transition-opacity duration-200",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
              <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              <span className="flex-1">{item.label}</span>
              {count > 0 ? (
                <span
                  aria-label={`${count} waiting for review`}
                  className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white"
                >
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/10 pt-4">
        <Link
          to="/"
          className="flex h-10 items-center gap-3 rounded-field px-3 text-[14px] font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowUpRight className="h-[18px] w-[18px]" strokeWidth={1.75} /> View website
        </Link>
        <div className="flex items-center gap-3 px-3 pt-3">
          <img src={me.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-white">{me.name}</p>
            <p className="text-[12px] text-white/50">Platform admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
