import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { useAppSelector } from "@/app/hooks";

export function useRequireAuth() {
  const navigate = useNavigate();
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  useEffect(() => {
    if (accessToken) return;
    navigate({ to: "/login", replace: true });
  }, [accessToken, navigate]);

  return Boolean(accessToken);
}
