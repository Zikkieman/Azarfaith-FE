import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { LogoutButton } from "@/components/LogoutButton";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-layout min-h-screen bg-white text-[#130e30]">
      <Navbar workspace />
      <main className="mx-auto max-w-[1280px] px-5 py-8 md:px-12 md:py-12">{children}</main>
      <footer className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 border-t border-[#efedf3] px-5 py-6 text-xs text-[#777283] md:px-12">
        <span>AzarFaith · Faith-based giving for Nigeria</span>
        <LogoutButton className="shrink-0 font-medium text-[#130e30] underline underline-offset-4" />
      </footer>
    </div>
  );
}
