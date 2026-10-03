import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Menu, Plus, X } from "lucide-react";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { me } from "@/lib/mock";

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  const navLink = (to: string, label: string, icon?: React.ReactNode) => {
    const active = path === to;
    return (
      <Link
        to={to as "/"}
        onClick={() => setMenuOpen(false)}
        className={`flex items-center gap-1 px-2.5 py-2 text-sm font-semibold transition-colors ${
          active ? "border-b-4 border-[#fe5102] text-white" : "text-white/70 hover:text-white"
        }`}
      >
        {icon}
        {label}
      </Link>
    );
  };

  return (
    <header className="bg-black px-6 md:px-[147px]">
      <div className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/">
            <AuthLogo className="flex items-center gap-[3px] [&_img:last-child]:brightness-0 [&_img:last-child]:invert" />
          </Link>
          <nav className="hidden items-center gap-3 md:flex">
            {navLink("/discover", "Discover")}
            {navLink("/create", "Start New campaign", <Plus className="h-4 w-4" />)}
            {navLink("/admin", "Manage")}
            {navLink("/my-giving", "My Giving")}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/profile" className="flex items-center gap-2 px-2.5 py-2 text-sm text-white">
            <span className="font-bold">{me.name}</span>
            <ChevronDown className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            className="grid h-9 w-9 place-items-center text-white md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-white/10 pb-4 pt-2 md:hidden">
          {navLink("/discover", "Discover")}
          {navLink("/create", "Start New campaign", <Plus className="h-4 w-4" />)}
          {navLink("/admin", "Manage")}
          {navLink("/my-giving", "My Giving")}
        </nav>
      )}
    </header>
  );
}
