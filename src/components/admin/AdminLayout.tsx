import { useEffect, useState, type ReactNode } from "react";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader, type Crumb, type Pager } from "./AdminHeader";
import { CommandPalette } from "./CommandPalette";
import { PaletteContext, SidebarContext } from "./context";

/** Admin frame: light sidebar beside white pages, a drawer on phones, ⌘K everywhere. */
export function AdminLayout() {
  const authed = useApp((s) => s.authed);
  const adminRole = useApp((s) => s.adminRole);
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    if (!authed || adminRole !== "platform_admin") navigate({ to: "/login" });
  }, [authed, adminRole, navigate]);

  useEffect(() => setOpen(false), [path]);

  if (!authed || adminRole !== "platform_admin") return null;

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <PaletteContext.Provider value={{ paletteOpen, setPaletteOpen }}>
        <div className="min-h-screen bg-paper font-gsf text-heading">
          <div className="fixed inset-y-0 left-0 z-40 hidden w-60 lg:block">
            <AdminSidebar />
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="left" className="w-72 border-0 p-0 sm:max-w-72">
              <SheetTitle className="sr-only">Admin navigation</SheetTitle>
              <AdminSidebar />
            </SheetContent>
          </Sheet>
          <div className="lg:pl-60">
            <Outlet />
          </div>
          <CommandPalette />
        </div>
      </PaletteContext.Provider>
    </SidebarContext.Provider>
  );
}

/**
 * One admin page. The title can carry a count ("Organizations 5"); detail pages pass `pager` to
 * step through the list they came from (after Twenty's "2 of 6").
 */
export function AdminPage({
  title,
  count,
  lead,
  actions,
  crumbs,
  pager,
  children,
  className,
  wide = true,
  dock = false,
}: {
  title: ReactNode;
  count?: number;
  lead?: ReactNode;
  actions?: ReactNode;
  crumbs?: Crumb[];
  pager?: Pager;
  children: ReactNode;
  className?: string;
  wide?: boolean;
  /** Pin the actions to the bottom of the screen on phones, so review pages never scroll back up. */
  dock?: boolean;
}) {
  const paused = useApp((s) => s.givingPaused);
  return (
    <>
      <AdminHeader crumbs={crumbs} pager={pager} />
      {paused ? (
        <div className="border-b border-danger/20 bg-danger/5 px-5 py-2.5 text-center text-[13px] text-danger sm:px-8">
          Giving is paused across AzarFaith. Givers see a notice and no payments are taken.
        </div>
      ) : null}
      <main
        className={cn(
          "admin-rise mx-auto flex w-full flex-col gap-6 px-4 pb-16 pt-5 sm:px-8 sm:pt-6",
          dock && actions && "pb-36 sm:pb-16",
          wide ? "max-w-[1400px]" : "max-w-[1040px]",
          className,
        )}
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="flex items-baseline gap-2.5 font-display text-[clamp(22px,1.9vw,26px)] leading-[1.25] tracking-[-0.02em] text-ink">
              <span className="min-w-0">{title}</span>
              {count !== undefined ? (
                <span className="font-gsf text-[15px] font-normal tabular-nums text-muted-ink">
                  {count}
                </span>
              ) : null}
            </h1>
            {lead ? <div className="text-sm leading-[1.55] text-muted-ink">{lead}</div> : null}
          </div>
          {actions ? (
            <div className={cn("flex shrink-0 flex-wrap gap-2", dock && "hidden sm:flex")}>
              {actions}
            </div>
          ) : null}
        </div>
        {children}
      </main>
      {dock && actions ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line-soft bg-paper/90 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:hidden [&_.flex-wrap]:flex-nowrap [&_a]:flex-1 [&_button]:flex-1 [&_p]:text-center">
          {actions}
        </div>
      ) : null}
    </>
  );
}
