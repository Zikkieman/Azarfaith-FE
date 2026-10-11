import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AdminDirectory } from "@/components/admin/AdminDirectory";
export const Route = createFileRoute("/admin/campaigns")({ component: AdminCampaigns });
function AdminCampaigns() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return path.replace(/\/$/, "") === "/admin/campaigns" ? (
    <AdminDirectory entity="campaign" />
  ) : (
    <Outlet />
  );
}
