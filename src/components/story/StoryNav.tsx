import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { cn } from "@/lib/utils";

const links: { label: string; to: string }[] = [
  { label: "How it works", to: "/story" },
  { label: "For givers", to: "/discover" },
  { label: "For organizations", to: "/fees-pricing" },
  { label: "Trust", to: "/verification" },
];

/** Minimal nav that tightens into a solid bar once the visitor starts scrolling. */
export function StoryNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,height] duration-300 motion-reduce:transition-none",
        scrolled
          ? "h-14 border-b border-line-soft bg-paper/95"
          : "h-[72px] border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-6 px-6 md:px-10">
        <Link to="/" aria-label="AzarFaith home">
          <AuthLogo />
        </Link>
        <nav aria-label="Story" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="rounded-full px-3 py-2 font-gsf text-[14px] font-medium text-ink-soft transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <Link
            to="/login"
            className="hidden px-3 py-2 font-gsf text-[14px] font-medium text-ink-soft hover:text-ink sm:block"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="press rounded-full border-2 border-ink bg-ink px-4 py-1.5 font-gsf text-[14px] font-semibold text-ink-contrast hover:opacity-90"
          >
            Start giving
          </Link>
        </div>
      </div>
    </header>
  );
}
