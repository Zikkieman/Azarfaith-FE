import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AdminDirectory } from "@/components/admin/AdminDirectory";
export const Route = createFileRoute("/admin/orgs")({ component: AdminOrgs });
function AdminOrgs() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return path.replace(/\/$/, "") === "/admin/orgs" ? (
    <AdminDirectory entity="organization" />
  ) : (
    <Outlet />
  );
}
