import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Flame, ArrowRight, Menu, X } from "lucide-react";
import { useAppSelector } from "@/app/hooks";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const authed = useAppSelector((state) => Boolean(state.auth.accessToken));
  const path = useRouterState({ select: (s) => s.location.pathname });

  const navLink = (to: string, label: string) => (
    <Link
      to={to as "/"}
      className={`transition text-sm ${path === to ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/60">
      <div className="mx-auto max-w-7xl px-5 md:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 grid place-items-center">
            <Flame className="w-4 h-4 fill-white text-white" />
          </div>
          <span className="font-display text-lg tracking-tight">AzarFaith</span>
        </Link>

        <div className="hidden md:flex items-center gap-7 text-sm">
          {authed ? (
            <>
              {navLink("/discover", "Discover")}
              {navLink("/create", "Start campaign")}
              {navLink("/my-giving", "My giving")}
              {navLink("/profile", "Profile")}
            </>
          ) : (
            <>
              {navLink("/discover", "Discover")}
              <Link
                to="/login"
                className={`transition text-sm ${path === "/login" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                Log in
              </Link>
            </>
          )}
          <Link
            to="/register-org"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition"
          >
            Register org <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-10 h-10 grid place-items-center rounded-xl hover:bg-muted transition"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border px-5 pb-5 pt-2 space-y-3 animate-in-up">
          <Link
            to="/discover"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm text-muted-foreground"
          >
            Discover
          </Link>
          {authed && (
            <>
              <Link
                to="/create"
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm text-muted-foreground"
              >
                Start campaign
              </Link>
              <Link
                to="/my-giving"
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm text-muted-foreground"
              >
                My giving
              </Link>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm text-muted-foreground"
              >
                Profile
              </Link>
            </>
          )}
          {!authed && (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm text-muted-foreground"
            >
              Log in
            </Link>
          )}
          <Link
            to="/register-org"
            onClick={() => setMenuOpen(false)}
            className="block w-full py-3 rounded-full bg-amber-500 text-white font-medium text-sm text-center"
          >
            Register your org
          </Link>
        </div>
      )}
    </nav>
  );
}
