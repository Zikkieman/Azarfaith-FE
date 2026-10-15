import { useEffect } from "react";
import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/lib/auth";
import { loginRedirect } from "@/lib/session";

export const Route = createFileRoute("/admin")({ component: AdminGate });

function AdminGate() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState({ select: (state) => state.location.href });
  const redirect = loginRedirect(location, "/admin");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (!location.startsWith("/login")) {
        void navigate({ to: "/login", search: { redirect }, replace: true });
      }
      return;
    }
    if (user.role !== "platform_admin") {
      void navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, location, navigate, redirect, user]);

  if (loading || !user || user.role !== "platform_admin") {
    return <div className="min-h-screen bg-paper" aria-busy="true" />;
  }
  return <AdminLayout />;
}
