import { useEffect, useState, type ReactNode } from "react";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader, type Crumb } from "./AdminHeader";
import { SidebarContext } from "./context";

/** Admin frame: fixed black sidebar on desktop, a drawer on phones, pages on a warm panel. */
export function AdminLayout() {
  const authed = useApp((s) => s.authed);
  const adminRole = useApp((s) => s.adminRole);
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!authed || adminRole !== "platform_admin") navigate({ to: "/login" });
  }, [authed, adminRole, navigate]);

  // Close the drawer whenever the page changes.
  useEffect(() => setOpen(false), [path]);

  if (!authed || adminRole !== "platform_admin") return null;

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div className="min-h-screen bg-panel font-gsf text-heading">
        <div className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
          <AdminSidebar />
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="left"
            className="w-72 border-0 bg-black p-0 sm:max-w-72 [&>button]:text-white/70 [&>button]:hover:bg-white/10 [&>button]:hover:text-white"
          >
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <AdminSidebar />
          </SheetContent>
        </Sheet>

        <div className="lg:pl-64">
          <Outlet />
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

/** One admin page: top bar, then a title block and the page body, rising in on arrival. */
export function AdminPage({
  title,
  lead,
  actions,
  crumbs,
  children,
  className,
}: {
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  crumbs?: Crumb[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <>
      <AdminHeader crumbs={crumbs} />
      <main
        className={cn(
          "admin-rise mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-5 py-8 sm:px-8 lg:py-10",
          className,
        )}
      >
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="font-display text-[clamp(26px,2.4vw,34px)] leading-[1.15] tracking-[-0.025em] text-ink">
              {title}
            </h1>
            {lead ? <div className="text-[15px] leading-[1.55] text-ink-soft">{lead}</div> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
        </div>
        {children}
      </main>
    </>
  );
}

/** A white card with an optional title row; the admin's one surface. */
export function AdminCard({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-card border border-line-soft bg-paper", className)}>
      {title ? (
        <div className="flex items-center justify-between gap-4 px-5 pt-5 sm:px-6">
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className={cn("p-5 sm:p-6", title && "pt-4 sm:pt-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Label / value rows for detail pages. */
export function DetailList({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="flex flex-col divide-y divide-line-soft">
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
        >
          <dt className="text-sm text-muted-ink">{r.label}</dt>
          <dd className="min-w-0 text-right text-sm font-medium text-ink">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
