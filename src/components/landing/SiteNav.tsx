import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import logo from "@/assets/landing/logo.svg";
import { useScrollDirection } from "@/lib/motion";
import { useApp } from "@/lib/store";

/**
 * Public website links only. The web app (dashboard, discover, giving…) sits behind log in and has
 * its own nav (components/app/AppNav.tsx); the only bridge is Log in / Go to dashboard.
 */
const links: { label: string; to: string; hash?: string; wide?: boolean }[] = [
  { label: "How it works", to: "/", hash: "how-it-works" },
  { label: "Ways to give", to: "/give-once" },
  { label: "For organizations", to: "/fees-pricing" },
  { label: "Trust & safety", to: "/verification" },
  { label: "About", to: "/about", wide: true },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const hidden = useScrollDirection();
  // The session lives in a cookie only the browser store reads, so switch after hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const authed = useApp((s) => s.authed) && mounted;
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setOpen(false), [path]);

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-black transition-transform duration-300 ease-out motion-reduce:transition-none ${
        hidden && !open ? "-translate-y-full" : ""
      }`}
    >
      <div className="mx-auto flex h-[60px] w-full max-w-[1728px] items-center justify-between gap-6 px-6 md:px-12 xl:px-[147px]">
        <Link to="/" className="shrink-0" aria-label="AzarFaith home">
          <img src={logo} alt="AzarFaith" className="h-[27.5px] w-[139.12px]" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {links.map((link) => {
            const current = !link.hash && path === link.to;
            return (
              <Link
                key={link.label}
                to={link.to}
                hash={link.hash}
                aria-current={current ? "page" : undefined}
                className={`rounded-full px-3 py-2 font-gsf text-[15px] font-medium transition-colors hover:text-white ${
                  current ? "text-white" : "text-white/70"
                } ${link.wide ? "hidden xl:block" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {authed ? (
            <Link
              to="/dashboard"
              className="press hidden items-center gap-2 rounded-full border-2 border-white bg-white px-5 py-2 font-gsf text-[15px] font-semibold text-black transition-opacity hover:opacity-90 sm:inline-flex"
            >
              Go to dashboard <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden px-3 py-2 font-gsf text-[15px] font-medium text-white/70 transition-colors hover:text-white sm:block"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="press hidden rounded-full border-2 border-white bg-white px-5 py-2 font-gsf text-[15px] font-semibold text-black transition-opacity hover:opacity-90 sm:inline-flex"
              >
                Get started
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid h-11 w-11 place-items-center text-white lg:hidden"
          >
            {open ? (
              <X className="h-6 w-6" strokeWidth={1.5} />
            ) : (
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          aria-label="Main"
          className="flex flex-col border-t border-white/10 px-6 pb-6 pt-2 md:px-12 lg:hidden"
        >
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              hash={link.hash}
              onClick={() => setOpen(false)}
              className="border-b border-white/10 py-3.5 font-gsf text-lg font-medium text-white/80"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-3 pt-5">
            {authed ? (
              <Link
                to="/dashboard"
                className="flex-1 rounded-full border-2 border-white bg-white py-3 text-center font-gsf text-base font-semibold text-black"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex-1 rounded-full border-2 border-white/40 py-3 text-center font-gsf text-base font-medium text-white"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="flex-1 rounded-full border-2 border-white bg-white py-3 text-center font-gsf text-base font-semibold text-black"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
