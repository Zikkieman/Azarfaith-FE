import { Link, useNavigate } from "@tanstack/react-router";
import { Flame, Globe } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { logout } from "@/features/auth/authSlice";

export function Footer() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authed = useAppSelector((state) => Boolean(state.auth.accessToken));

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-5 md:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500 grid place-items-center">
                <Flame className="w-5 h-5 fill-white text-white" />
              </div>
              <span className="font-display text-xl tracking-tight">AzarFaith</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Faith-based giving for Nigeria. Verified churches, missionaries, and ministries.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-muted grid place-items-center text-muted-foreground hover:text-foreground hover:bg-accent transition"
                aria-label="Twitter"
              >
                <Globe className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-muted grid place-items-center text-muted-foreground hover:text-foreground hover:bg-accent transition"
                aria-label="Instagram"
              >
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>
          <FooterCol
            title="Platform"
            links={[
              { label: "Discover causes", to: "/discover" },
              { label: "Start a campaign", to: "/create" },
              { label: "Register your org", to: "/register-org" },
            ]}
          />
          <FooterCol
            title="Account"
            links={
              authed
                ? [
                    { label: "My giving", to: "/my-giving" },
                    { label: "Profile", to: "/profile" },
                  ]
                : []
            }
            action={
              authed ? (
                <button
                  type="button"
                  onClick={() => {
                    dispatch(logout());
                    navigate({ to: "/login" });
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition"
                >
                  Log out
                </button>
              ) : (
                <Link
                  to="/login"
                  className="text-sm text-muted-foreground hover:text-foreground transition"
                >
                  Log in
                </Link>
              )
            }
          />
          <FooterCol
            title="Trust"
            links={[
              { label: "Verified orgs only", href: "#" },
              { label: "Report a cause", href: "#" },
            ]}
          />
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; 2026 AzarFaith. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with <Flame className="w-3 h-3 inline fill-amber-500 text-amber-500" /> for
            Nigeria
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
  action,
}: {
  title: string;
  links: { label: string; to?: string; href?: string }[];
  action?: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            {link.to ? (
              <Link
                to={link.to}
                className="text-sm text-muted-foreground hover:text-foreground transition"
              >
                {link.label}
              </Link>
            ) : (
              <a
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition"
              >
                {link.label}
              </a>
            )}
          </li>
        ))}
        {action ? <li>{action}</li> : null}
      </ul>
    </div>
  );
}
