import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { useAppSelector } from "@/app/hooks";

export function useRequireAuth() {
  const navigate = useNavigate();
  const { user, hydrated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!hydrated || user) return;
    navigate({ to: "/", replace: true });
  }, [hydrated, user, navigate]);

  return hydrated && Boolean(user);
}
