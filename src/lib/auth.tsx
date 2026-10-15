import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch, ApiError } from "@/lib/api";
import { useApp } from "@/lib/store";

export type AuthUser = {
  id: string;
  email: string;
  phone: string | null;
  fullName: string;
  isVerified: boolean;
  role: "donor" | "org_admin" | "platform_admin";
  status: "active" | "suspended";
  avatarUrl?: string | null;
};

type AuthResponse = { user: AuthUser };
type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function getSession() {
  try {
    return await apiFetch<AuthResponse>("/auth/session");
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
    throw error;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useQuery({
    queryKey: ["auth-session"],
    queryFn: getSession,
    enabled: typeof window !== "undefined",
    retry: false,
    staleTime: 60_000,
  });
  const [override, setOverride] = useState<AuthUser | null | undefined>(undefined);
  const user = override === undefined ? (session.data?.user ?? null) : override;
  const loading = override === undefined && session.isLoading;

  useEffect(() => {
    useApp.setState({
      authed: Boolean(user),
      adminRole: user?.role === "platform_admin" ? "platform_admin" : null,
    });
  }, [user]);

  const value: AuthContextValue = {
    user,
    loading,
    setUser: setOverride,
    refresh: async () => {
      setOverride(undefined);
      await session.refetch();
    },
    logout: async () => {
      try {
        await apiFetch("/auth/logout", { method: "POST" });
      } finally {
        setOverride(null);
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
