import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AdminDirectory } from "@/components/admin/AdminDirectory";
export const Route = createFileRoute("/admin/campaigns")({
  validateSearch: (search: Record<string, unknown>): { view?: "pending" | "all" } => ({
    view: search.view === "pending" ? "pending" : search.view === "all" ? "all" : undefined,
  }),
  component: AdminCampaigns,
});
function AdminCampaigns() {
  const { view } = Route.useSearch();
  const path = useRouterState({ select: (state) => state.location.pathname });
  return path.replace(/\/$/, "") === "/admin/campaigns" ? (
    <AdminDirectory
      key={view}
      entity="campaign"
      initialStatus={view === "pending" ? "PENDING" : ""}
    />
  ) : (
    <Outlet />
  );
}
