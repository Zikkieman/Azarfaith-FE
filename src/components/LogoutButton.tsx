import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAppDispatch } from "@/app/hooks";
import { logout } from "@/features/auth/authSlice";
import { getErrorMessage } from "@/lib/errors";

export function LogoutButton({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      onClick={async () => {
        if (pending) return;
        setPending(true);
        try {
          await dispatch(logout()).unwrap();
          await queryClient.cancelQueries();
          queryClient.clear();
          navigate({ to: "/login" });
        } catch (error) {
          toast.error(getErrorMessage(error, "Could not sign out. Please try again."));
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Signing out..." : "Log out"}
    </button>
  );
}
