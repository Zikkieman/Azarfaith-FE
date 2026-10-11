import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logoMark from "@/assets/signup/logo-mark.svg";
import logoWordmark from "@/assets/signup/logo-wordmark.svg";

// Layout adapted from mos-ski/azarfaith; all authentication remains server-backed.
export function AuthLayout({
  prompt,
  linkLabel,
  linkTo,
  returnTo,
  children,
}: {
  prompt: string;
  linkLabel: string;
  linkTo: "/login" | "/signup";
  returnTo?: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-layout min-h-screen bg-white text-[#232323] lg:grid lg:grid-cols-2">
      <div className="flex min-h-screen flex-col px-6 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between gap-4 py-6">
          <Link to="/" aria-label="AzarFaith home" className="flex shrink-0 items-center gap-1">
            <img src={logoMark} alt="" className="h-[26px] w-[26px]" />
            <img src={logoWordmark} alt="AzarFaith" className="h-[23px] w-auto" />
          </Link>
          <p className="text-sm text-[#4a4660]">
            <span className="hidden sm:inline">{prompt} </span>
            <Link
              to={linkTo}
              search={{ returnTo }}
              className="font-semibold text-[#130e30] underline underline-offset-4"
            >
              {linkLabel}
            </Link>
          </p>
        </header>
        <main className="flex flex-1 items-center justify-center py-10 lg:py-16">
          <div className="w-full max-w-[400px]">{children}</div>
        </main>
      </div>
      <aside className="hidden p-4 lg:block" aria-label="Faith-based giving">
        <div className="sticky top-4 h-[calc(100svh-32px)] overflow-hidden rounded-[20px] bg-[radial-gradient(ellipse_at_top,_#fde5d8,_#f5f4f0_65%)]">
          <img
            src="https://images.unsplash.com/photo-1710093072218-0024b8391475?auto=format&fit=crop&w=1400&q=80"
            alt=""
            onError={(event) => {
              event.currentTarget.style.opacity = "0";
            }}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-6 bottom-6 flex max-w-[400px] flex-col gap-2 rounded-[20px] bg-white p-5">
            <p className="text-[13px] text-[#667085]">Faith-based giving for Nigeria</p>
            <p className="text-xl font-medium leading-snug text-[#130e30]">
              Give to the work you believe in.
            </p>
            <p className="text-[13px] leading-relaxed text-[#667085]">
              Support causes, follow their updates, and manage your giving in one place.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
