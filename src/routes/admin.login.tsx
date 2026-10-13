import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthField";
import { AuthButton, AuthError, AuthHeading } from "@/components/auth/AuthContent";
import { AuthCard } from "@/components/auth/AuthCard";
import { adminLogin, clearAuthError } from "@/features/auth/authSlice";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
  head: () => ({ meta: [{ title: "Admin sign in — AzarFaith" }] }),
});

function AdminLogin() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, hydrated, loading, error } = useAppSelector((state) => state.auth);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);
  useEffect(() => {
    if (hydrated && user?.role === "platform_admin") navigate({ to: "/admin", replace: true });
  }, [hydrated, user?.role, navigate]);

  return (
    <AuthLayout prompt="Looking to give?" linkLabel="Donor sign in" linkTo="/login">
      <AuthCard>
        <AuthHeading title="Admin sign in">
          Restricted to platform administrators. Admin accounts are assigned by the AzarFaith team.
        </AuthHeading>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (loading) return;
            const next = {
              identifier: identifier.trim() ? undefined : "Enter your admin email or phone number.",
              password: password ? undefined : "Enter your password.",
            };
            setErrors(next);
            if (next.identifier || next.password) return;
            dispatch(clearAuthError());
            try {
              await dispatch(adminLogin({ identifier: identifier.trim(), password })).unwrap();
              navigate({ to: "/admin" });
            } catch (err) {
              toast.error(getErrorMessage(err, "Admin login failed"));
            }
          }}
        >
          <AuthField
            label="Email or phone"
            autoComplete="username"
            value={identifier}
            error={errors.identifier}
            onChange={(event) => {
              setIdentifier(event.target.value);
              setErrors({});
            }}
          />
          <AuthField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            error={errors.password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors({});
            }}
          />
          <AuthError message={error} />
          <AuthButton disabled={loading}>
            {loading ? "Signing in..." : "Enter admin console"}
          </AuthButton>
          <Link
            to="/forgot-password"
            className="self-end text-[13px] font-medium text-ink-soft underline decoration-1 underline-offset-4 hover:text-ink"
          >
            Forgot your password?
          </Link>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
