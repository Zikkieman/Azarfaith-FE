import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AdminDirectory } from "@/components/admin/AdminDirectory";
export const Route = createFileRoute("/admin/users")({ component: AdminUsers });
function AdminUsers() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return path.replace(/\/$/, "") === "/admin/users" ? <AdminDirectory entity="user" /> : <Outlet />;
}
