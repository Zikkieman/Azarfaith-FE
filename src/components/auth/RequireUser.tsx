import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { loginRedirect } from "@/lib/session";

/** Guards workspace-only screens while public causes and checkout remain open to guests. */
export function RequireUser({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const href = useRouterState({ select: (state) => state.location.href });
  const redirect = loginRedirect(href);

  useEffect(() => {
    if (!loading && !user && !href.startsWith("/login")) {
      void navigate({ to: "/login", search: { redirect }, replace: true });
    }
  }, [href, loading, navigate, redirect, user]);

  if (loading || !user) return <div className="min-h-screen bg-paper" aria-busy="true" />;
  return <>{children}</>;
}
