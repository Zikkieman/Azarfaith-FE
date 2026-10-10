import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchSession } from "@/features/auth/authSlice";
import { ApiError } from "@/lib/api";
import { useClientReady } from "@/lib/useClientReady";
import { useRequireAuth } from "@/lib/useRequireAuth";

export function useCreationSession(error?: unknown) {
  const authed = useRequireAuth();
  const ready = useClientReady() && authed;
  const userId = useAppSelector((state) => state.auth.user?.id);
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (error instanceof ApiError && [401, 403].includes(error.status))
      void dispatch(fetchSession());
  }, [dispatch, error]);
  return { ready, userId };
}
