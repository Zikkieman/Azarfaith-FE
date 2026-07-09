import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useAppSelector } from "@/app/hooks";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

const SidebarContext = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
}>({ open: false, setOpen: () => {} });

export const useSidebar = () => useContext(SidebarContext);

export function AdminLayout() {
  const { hydrated, user } = useAppSelector((state) => state.auth);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isPlatformAdmin = user?.role === "platform_admin";
  const isAdminLoginRoute = pathname === "/admin/login";

  useEffect(() => {
    const handler = () => setSidebarOpen(false);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  if (isAdminLoginRoute) {
    return <Outlet />;
  }

  if (!hydrated || !user || !isPlatformAdmin) {
    if (!hydrated) {
      return null;
    }

    if (!user) {
      return <Navigate to="/admin/login" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return (
    <SidebarContext.Provider value={{ open: sidebarOpen, setOpen: setSidebarOpen }}>
      <div className="min-h-screen bg-gray-50">
        {/* Desktop sidebar — always visible on lg+ */}
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>

        {/* Mobile sidebar — slide in overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-60 lg:hidden">
              <AdminSidebar />
            </div>
          </>
        )}

        {/* Main content area */}
        <div className="min-h-screen lg:pl-60">
          <main className="min-h-screen">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

export function AdminPageWrapper({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <AdminHeader title={title} />
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}
