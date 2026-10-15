import { useEffect } from "react";
import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({ component: AdminGate });

function AdminGate() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState({ select: (state) => state.location.href });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/login", search: { redirect: location }, replace: true });
    } else if (user.role !== "platform_admin") {
      void navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, location, navigate, user]);

  if (loading || !user || user.role !== "platform_admin") {
    return <div className="min-h-screen bg-paper" aria-busy="true" />;
  }
  return <AdminLayout />;
}
