import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { hasSession } from "@/lib/session";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ location }) => {
    if (!hasSession()) throw redirect({ to: "/login", search: { redirect: location.href } });
  },
  component: AdminLayout,
});
