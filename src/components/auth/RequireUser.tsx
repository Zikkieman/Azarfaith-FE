import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

/** Guards workspace-only screens while public causes and checkout remain open to guests. */
export function RequireUser({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const href = useRouterState({ select: (state) => state.location.href });

  useEffect(() => {
    if (!loading && !user) {
      void navigate({ to: "/login", search: { redirect: href }, replace: true });
    }
  }, [href, loading, navigate, user]);

  if (loading || !user) return <div className="min-h-screen bg-paper" aria-busy="true" />;
  return <>{children}</>;
}
