import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useAppSelector } from "@/app/hooks";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { PageSpinner } from "@/components/PageSpinner";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminNavigationContext } from "./AdminNavigationContext";

export function AdminLayout() {
  const { hydrated, user } = useAppSelector((state) => state.auth);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  if (pathname === "/admin/login") return <Outlet />;
  if (!hydrated) return <PageSpinner label="Checking admin session" />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== "platform_admin") return <Navigate to="/" replace />;
  return (
    <AdminNavigationContext.Provider value={{ open, setOpen }}>
      <div className="admin-frame min-h-screen bg-paper font-gsf text-ink">
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
      </div>
    </AdminNavigationContext.Provider>
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
    <>
      <AdminHeader title={title} />
      <main className="admin-page mx-auto w-full max-w-[1400px] px-4 pb-16 pt-6 sm:px-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="break-words font-display text-[clamp(24px,2vw,30px)] leading-tight tracking-tight">
              {title}
            </h1>
            {lead && <p className="mt-2 text-sm text-muted-ink">{lead}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
        {children}
      </main>
    </>
  );
}
