import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AdminDirectory } from "@/components/admin/AdminDirectory";
export const Route = createFileRoute("/admin/orgs")({
  validateSearch: (search: Record<string, unknown>): { view?: "pending" | "all" } => ({
    view: search.view === "pending" ? "pending" : search.view === "all" ? "all" : undefined,
  }),
  component: AdminOrgs,
});
function AdminOrgs() {
  const { view } = Route.useSearch();
  const path = useRouterState({ select: (state) => state.location.pathname });
  return path.replace(/\/$/, "") === "/admin/orgs" ? (
    <AdminDirectory
      key={view}
      entity="organization"
      initialStatus={view === "pending" ? "PENDING" : ""}
    />
  ) : (
    <Outlet />
  );
}
