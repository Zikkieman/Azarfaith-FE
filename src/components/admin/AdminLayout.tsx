import { useEffect, useRef, useState, type ReactNode } from "react";
import { Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Sheet, SheetContent, SheetTitle } from "@/components/app/DesignSheet";
import { PageSpinner } from "@/components/PageSpinner";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader, type Crumb, type Pager } from "./AdminHeader";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, adminApiFetch } from "@/lib/api";
import type { GivingControl } from "./AdminGivingControl";
import { AdminCommandPalette } from "./AdminCommandPalette";
import { PaletteContext } from "./AdminNavigationContext";
import { fetchSession } from "@/features/auth/authSlice";
import { AdminNavigationContext } from "./AdminNavigationContext";

export function AdminLayout() {
  const { hydrated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch(),
    client = useQueryClient(),
    refreshing = useRef(false);
  useEffect(() => {
    if (!hydrated || user?.role !== "platform_admin") return;
    return client.getQueryCache().subscribe((event) => {
      const error = event.query.state.error ?? event.query.state.fetchFailureReason;
      if (
        event.type !== "updated" ||
        event.query.queryKey[0] !== "admin" ||
        !(error instanceof ApiError) ||
        ![401, 403].includes(error.status) ||
        refreshing.current
      )
        return;
      refreshing.current = true;
      void dispatch(fetchSession())
        .unwrap()
        .then((session) => {
          if (session.user?.role !== "platform_admin") {
            void client
              .cancelQueries({ queryKey: ["admin"] })
              .then(() => client.removeQueries({ queryKey: ["admin"] }));
          }
        })
        .catch((error) => {
          if (
            error &&
            typeof error === "object" &&
            "unauthenticated" in error &&
            error.unauthenticated
          ) {
            void client
              .cancelQueries({ queryKey: ["admin"] })
              .then(() => client.removeQueries({ queryKey: ["admin"] }));
          }
        })
        .finally(() => {
          refreshing.current = false;
        });
    });
  }, [hydrated, user?.role, dispatch, client]);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  if (pathname === "/admin/login") return <Outlet />;
  if (!hydrated) return <PageSpinner label="Checking admin session" />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== "platform_admin") return <Navigate to="/" replace />;
  return (
    <AdminNavigationContext.Provider value={{ open, setOpen }}>
      <PaletteContext.Provider value={{ paletteOpen, setPaletteOpen }}>
        <div className="designer-app min-h-screen bg-paper font-gsf text-heading">
          <div className="fixed inset-y-0 left-0 z-40 hidden w-60 lg:block">
            <AdminSidebar />
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="left" className="w-72 border-0 p-0 sm:max-w-72">
              <SheetTitle className="sr-only">Admin navigation</SheetTitle>
              <AdminSidebar />
            </SheetContent>
          </Sheet>
          <div className="min-w-0 lg:pl-60">
            <Outlet />
          </div>
          <AdminCommandPalette />
        </div>
      </PaletteContext.Provider>
    </AdminNavigationContext.Provider>
  );
}

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
  const isAdmin = useAppSelector((state) => state.auth.user?.role === "platform_admin");
  const giving = useQuery({
    enabled: isAdmin,
    queryKey: ["admin", "giving-control"],
    queryFn: () => adminApiFetch<GivingControl>("/admin/review/giving-control"),
    refetchInterval: 30_000,
  });
  const paused = giving.data?.givingPaused;
  if (!isAdmin) return null;
  return (
    <>
      <AdminHeader crumbs={crumbs} pager={pager} />
      {paused ? (
        <div className="border-b border-danger/20 bg-danger/5 px-5 py-2.5 text-center text-[13px] text-danger sm:px-8">
          Giving is paused across AzarFaith. New gifts and recurring charges are blocked.
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

export function AdminPageWrapper({
  title,
  children,
  lead,
  actions,
}: {
  title: string;
  children: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <AdminPage title={title} lead={lead} actions={actions} crumbs={[{ label: title }]}>
      {children}
    </AdminPage>
  );
}
