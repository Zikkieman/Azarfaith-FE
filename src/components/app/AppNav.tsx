import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, HeartHandshake, LogOut, Menu, Plus, Shield, User, X } from "lucide-react";
import logo from "@/assets/landing/logo.svg";
import iconChevron from "@/assets/landing/icon-chevron-down.svg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { logout } from "@/features/auth/authSlice";
import { toast } from "sonner";
import { NotificationMenu } from "@/components/NotificationMenu";
import { useScrollDirection } from "@/lib/motion";
import { useClientReady } from "@/lib/useClientReady";

const navLinks = [
  { label: "Discover", to: "/discover" },
  { label: "My giving", to: "/my-giving" },
  { label: "Manage", to: "/dashboard" },
];

const menuItemClass =
  "flex cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2.5 font-gsf text-sm text-ink focus:bg-panel";

/** Signed-in app nav. `active` overrides the link highlighted from the current route. */
export function AppNav({ active }: { active?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hideOnScroll = useScrollDirection();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const dispatch = useAppDispatch();
  const { user: sessionUser, loading, hydrated } = useAppSelector((s) => s.auth);
  const ready = useClientReady();
  const user = ready ? sessionUser : null;
  const [signingOut, setSigningOut] = useState(false);
  const adminRole = user?.role;

  const fromPath = navLinks.find((l) => path === l.to || path.startsWith(`${l.to}/`))?.label;
  const current =
    active ?? fromPath ?? (path.startsWith("/manage") ? "Manage" : path === "/" ? "Discover" : "");

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await dispatch(logout()).unwrap();
      setMenuOpen(false);
      await navigate({ to: "/login", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not log out. Please try again.");
    } finally {
      setSigningOut(false);
    }
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
                  current === link.label ? "border-b-4 border-brand text-white" : "text-white/70"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1 lg:gap-4">
          {hydrated && user ? (
            <span className="text-white">
              <NotificationMenu userId={user.id} />
            </span>
          ) : null}
          <Link
            to="/create"
            className="press hidden h-9 items-center gap-1.5 rounded-full bg-paper px-4 font-gsf text-sm font-semibold text-ink transition-colors hover:bg-ink-contrast lg:inline-flex"
          >
            <Plus className="h-4 w-4" strokeWidth={2} /> Start a campaign
          </Link>
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger className="hidden cursor-pointer items-center gap-2.5 px-2.5 py-2.5 text-left outline-none lg:flex">
                  <span className="font-gsf text-base font-bold leading-[35px] text-white">
                    {user?.fullName ?? "Your account"}
                  </span>
                  <img src={iconChevron} alt="" className="h-6 w-6" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-60 rounded-field border border-line-soft bg-paper p-1.5 shadow-none"
                >
                  <div className="px-3 pb-2 pt-1.5">
                    <p className="font-gsf text-sm font-semibold text-ink">
                      {user?.fullName ?? "Your account"}
                    </p>
                    <p className="font-gsf text-[13px] text-muted-ink">{user?.email}</p>
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
                  <DropdownMenuItem asChild className={menuItemClass}>
                    <Link to="/manage">
                      <Building2 className="h-4 w-4" strokeWidth={1.5} /> All organizations and
                      drafts
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
                  <DropdownMenuItem
                    disabled={signingOut || loading}
                    onSelect={() => void signOut()}
                    className={menuItemClass}
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.5} />{" "}
                    {signingOut ? "Logging out..." : "Log out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/login" className="px-3 py-2 font-gsf text-sm font-medium text-white">
              Log in
            </Link>
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
              {link.label}
              {current === link.label ? (
                <span className="ml-auto h-2 w-2 rounded-full bg-brand" />
              ) : null}
            </Link>
          ))}
          {user ? (
            <>
              <>
                <Link
                  to="/create"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 border-b border-white/10 py-3.5 font-gsf text-base font-semibold text-white/70"
                >
                  <Plus className="h-4 w-4" strokeWidth={2} /> Start a campaign
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-white/10 py-3.5 font-gsf text-base font-semibold text-white/70"
                >
                  Profile
                </Link>
                <Link
                  to="/register-org"
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-white/10 py-3.5 font-gsf text-base font-semibold text-white/70"
                >
                  Register your org
                </Link>
                <Link
                  to="/manage"
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-white/10 py-3.5 font-gsf text-base font-semibold text-white/70"
                >
                  All organizations and drafts
                </Link>
                {adminRole === "platform_admin" ? (
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="border-b border-white/10 py-3.5 font-gsf text-base font-semibold text-white/70"
                  >
                    Admin
                  </Link>
                ) : null}
                <button
                  type="button"
                  disabled={signingOut || loading}
                  onClick={() => void signOut()}
                  className="py-3.5 text-left font-gsf text-base font-semibold text-white/70"
                >
                  Log out
                </button>
              </>
            </>
          ) : (
            <Link
              to="/signup"
              search={{ mode: "choose", returnTo: undefined }}
              onClick={() => setMenuOpen(false)}
              className="py-3.5 font-gsf text-base font-semibold text-white/70"
            >
              Get started
            </Link>
          )}
        </nav>
      ) : null}
    </header>
  );
}
