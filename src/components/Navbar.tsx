import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Flame, ArrowRight, Menu, X } from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import { useClientReady } from "@/lib/useClientReady";
import { NotificationMenu } from "@/components/NotificationMenu";

export function Navbar({ workspace = false }: { workspace?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useAppSelector((state) => state.auth.user);
  const authed = useClientReady() && Boolean(user);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const primaryCta = authed ? "/register-org" : "/signup";
  const links = authed
    ? [
        ["/discover", "Discover"],
        ["/dashboard", "Dashboard"],
        ["/manage", "Manage"],
        ["/my-giving", "My giving"],
        ["/profile", "Profile"],
      ]
    : [
        ["/discover", "Discover"],
        ["/login", "Log in"],
      ];
  return (
    <nav
      className={`sticky top-0 z-50 border-b ${workspace ? "workspace-nav border-white/10 bg-black text-white" : "border-border/60 bg-background/90 backdrop-blur-md"}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <Link to={authed ? "/dashboard" : "/"} className="flex shrink-0 items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500">
            <Flame className="h-4 w-4 fill-white text-white" />
          </div>
          <span className="font-display text-lg tracking-tight">AzarFaith</span>
        </Link>
        <div className="flex items-center gap-3 lg:gap-7">
          <div className="hidden items-center gap-7 lg:flex">
            {links.map(([to, label]) => (
              <Link
                key={to}
                to={to as "/"}
                aria-current={path === to ? "page" : undefined}
                className={`text-sm transition ${path === to ? "font-semibold underline decoration-amber-500 underline-offset-8" : "opacity-70 hover:opacity-100"}`}
              >
                {label}
              </Link>
            ))}
          </div>
          {authed && user && <NotificationMenu key={user.id} userId={user.id} />}
          <Link
            to={primaryCta}
            className="hidden items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600 lg:inline-flex"
          >
            Register org <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
            className="grid h-10 w-10 place-items-center rounded-xl hover:bg-current/10 lg:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div
          id="mobile-navigation"
          className="space-y-2 border-t border-current/10 px-5 pb-5 pt-2 lg:hidden"
        >
          {links.map(([to, label]) => (
            <Link
              key={to}
              to={to as "/"}
              onClick={() => setMenuOpen(false)}
              aria-current={path === to ? "page" : undefined}
              className={`block py-2 text-sm ${path === to ? "font-semibold" : "opacity-70"}`}
            >
              {label}
            </Link>
          ))}
          {authed && (
            <Link to="/create" onClick={() => setMenuOpen(false)} className="block py-2 text-sm">
              Start campaign
            </Link>
          )}
          <Link
            to={primaryCta}
            onClick={() => setMenuOpen(false)}
            className="block rounded-full bg-amber-500 py-3 text-center text-sm font-medium text-white"
          >
            Register your org
          </Link>
        </div>
      )}
    </nav>
  );
}
