import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, HeartHandshake, LogOut, Menu, Shield, User, X } from "lucide-react";
import logo from "@/assets/landing/logo.svg";
import iconAdd from "@/assets/landing/icon-add.svg";
import iconChevron from "@/assets/landing/icon-chevron-down.svg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp } from "@/lib/store";
import { useScrollDirection } from "@/lib/motion";
import { me } from "@/lib/mock";

const navLinks = [
  { label: "Discover", to: "/discover" },
  { label: "Start New campaign", to: "/create", icon: iconAdd },
  { label: "Manage", to: "/dashboard" },
  { label: "My Giving", to: "/my-giving" },
];

const menuItemClass =
  "flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 font-gsf text-sm text-ink focus:bg-panel";

/** Signed-in app nav. `active` overrides the link highlighted from the current route. */
export function AppNav({ active }: { active?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hideOnScroll = useScrollDirection();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const authed = useApp((s) => s.authed);
  const setAuthed = useApp((s) => s.setAuthed);
  const adminRole = useApp((s) => s.adminRole);

  const fromPath = navLinks.find((l) => path === l.to || path.startsWith(`${l.to}/`))?.label;
  const current = active ?? fromPath ?? (path === "/" ? "Discover" : "");

  const signOut = () => {
    setAuthed(false);
    setMenuOpen(false);
    navigate({ to: "/" });
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-black transition-transform duration-300 ease-out motion-reduce:transition-none ${
        hideOnScroll && !menuOpen ? "-translate-y-full" : ""
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1728px] items-center justify-between gap-6 px-6 md:px-12 xl:px-[147px]">
        <div className="flex items-center gap-5 md:gap-8">
          <Link to="/" className="shrink-0 py-2.5">
            <img src={logo} alt="AzarFaith" className="h-[27.5px] w-[139.12px]" />
          </Link>

          <nav className="hidden items-center gap-3 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`flex items-center gap-1 px-2.5 py-2.5 font-gsf text-base font-semibold leading-[35px] transition-colors hover:text-white ${
                  current === link.label
                    ? "border-b-4 border-[#FE5102] text-white"
                    : "text-white/70"
                }`}
              >
                {link.icon ? <img src={link.icon} alt="" className="h-[18px] w-[18px]" /> : null}
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1 lg:gap-2">
          {authed ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden cursor-pointer items-center gap-2.5 px-2.5 py-2.5 text-left outline-none lg:flex">
                <span className="font-gsf text-base font-bold leading-[35px] text-white">
                  {me.name}
                </span>
                <img src={iconChevron} alt="" className="h-6 w-6" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-60 rounded-xl border border-line-soft bg-paper p-1.5 shadow-none"
              >
                <div className="px-3 pb-2 pt-1.5">
                  <p className="font-gsf text-sm font-semibold text-ink">{me.name}</p>
                  <p className="font-gsf text-[13px] text-muted-ink">{me.location}</p>
                </div>
                <DropdownMenuSeparator className="bg-line-soft" />
                <DropdownMenuItem asChild className={menuItemClass}>
                  <Link to="/profile">
                    <User className="h-4 w-4" strokeWidth={1.5} /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={menuItemClass}>
                  <Link to="/my-giving">
                    <HeartHandshake className="h-4 w-4" strokeWidth={1.5} /> My giving
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={menuItemClass}>
                  <Link to="/register-org">
                    <Building2 className="h-4 w-4" strokeWidth={1.5} /> Register your org
                  </Link>
                </DropdownMenuItem>
                {adminRole === "platform_admin" ? (
                  <DropdownMenuItem asChild className={menuItemClass}>
                    <Link to="/admin">
                      <Shield className="h-4 w-4" strokeWidth={1.5} /> Admin
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator className="bg-line-soft" />
                <DropdownMenuItem onSelect={signOut} className={menuItemClass}>
                  <LogOut className="h-4 w-4" strokeWidth={1.5} /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Link
                to="/login"
                className="px-2.5 py-2.5 font-gsf text-base font-semibold leading-[35px] text-white/70 transition-colors hover:text-white"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-full border-2 border-white px-[22px] py-2.5 font-gsf text-base font-medium leading-5 tracking-[-0.02em] text-white transition-colors hover:bg-white hover:text-black"
              >
                Start giving
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="grid h-11 w-11 place-items-center text-white lg:hidden"
          >
            {menuOpen ? (
              <X className="h-6 w-6" strokeWidth={1.5} />
            ) : (
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav className="flex flex-col border-t border-white/10 px-6 pb-6 pt-2 md:px-12 lg:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2 border-b border-white/10 py-3.5 font-gsf text-base font-semibold ${
                current === link.label ? "text-white" : "text-white/70"
              }`}
            >
              {link.icon ? <img src={link.icon} alt="" className="h-[18px] w-[18px]" /> : null}
              {link.label}
              {current === link.label ? (
                <span className="ml-auto h-2 w-2 rounded-full bg-[#FE5102]" />
              ) : null}
            </Link>
          ))}
          {authed ? (
            <>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="border-b border-white/10 py-3.5 font-gsf text-base font-semibold text-white/70"
              >
                Profile · {me.name}
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="py-3.5 text-left font-gsf text-base font-semibold text-white/70"
              >
                Log out
              </button>
            </>
          ) : (
            <div className="flex gap-3 pt-5">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex-1 rounded-full border-2 border-white/40 py-3 text-center font-gsf text-base font-medium text-white"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                onClick={() => setMenuOpen(false)}
                className="flex-1 rounded-full border-2 border-white bg-white py-3 text-center font-gsf text-base font-medium text-black"
              >
                Start giving
              </Link>
            </div>
          )}
        </nav>
      ) : null}
    </header>
  );
}
