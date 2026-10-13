import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthField";
import { AuthButton, AuthError, AuthHeading } from "@/components/auth/AuthContent";
import { AuthCard } from "@/components/auth/AuthCard";
import { btn } from "@/components/app/btn";
import { cn } from "@/lib/utils";
import { clearAuthError, resetPassword } from "@/features/auth/authSlice";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  component: ResetPassword,
  head: () => ({ meta: [{ title: "Choose a new password — AzarFaith" }] }),
});

function ResetPassword() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const { token } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  return (
    <AuthLayout prompt="Remember your password?" linkLabel="Sign in" linkTo="/login">
      <AuthCard>
        <AuthHeading title={done ? "Password updated" : "Choose a new password"}>
          {done
            ? "Your password has been changed. Sign in with your new password."
            : "Use a strong password you haven't used elsewhere."}
        </AuthHeading>
        {done ? (
          <Link to="/login" className={cn(btn("primary", "lg"), "w-full")}>
            Sign in
          </Link>
        ) : !token ? (
          <div className="flex flex-col gap-4">
            <AuthError message="This reset link is missing its token. Request a new link to continue." />
            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-ink underline underline-offset-4"
            >
              Request a new reset link
            </Link>
          </div>
        ) : (
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (loading) return;
              const next = {
                password:
                  password.length < 8
                    ? "Use at least 8 characters."
                    : new TextEncoder().encode(password).length > 72
                      ? "Use a password no longer than 72 bytes."
                      : undefined,
                confirm: password !== confirm ? "Passwords do not match." : undefined,
              };
              setErrors(next);
              if (next.password || next.confirm) return;
              dispatch(clearAuthError());
              try {
                await dispatch(resetPassword({ token, password })).unwrap();
                setDone(true);
              } catch (err) {
                toast.error(getErrorMessage(err, "Could not reset your password"));
              }
            }}
          >
            <AuthField
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password}
              error={errors.password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors({});
              }}
            />
            <AuthField
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              error={errors.confirm}
              onChange={(event) => {
                setConfirm(event.target.value);
                setErrors({});
              }}
            />
            <AuthError message={error} />
            <AuthButton disabled={loading}>{loading ? "Saving..." : "Reset password"}</AuthButton>
          </form>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
