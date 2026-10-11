import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthField";
import { AuthButton, AuthError, AuthHeading } from "@/components/auth/AuthContent";
import { clearAuthError, resetPassword } from "@/features/auth/authSlice";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  component: ResetPassword,
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
      <AuthHeading title={done ? "Password updated" : "Choose a new password"}>
        {done
          ? "Your password has been changed. Sign in with your new password."
          : "Use a strong password you haven't used elsewhere."}
      </AuthHeading>
      {done ? (
        <Link
          to="/login"
          className="flex min-h-12 items-center justify-center rounded-xl bg-[#130e30] text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      ) : !token ? (
        <div className="space-y-5">
          <AuthError message="This reset link is missing its token. Request a new link to continue." />
          <Link to="/forgot-password" className="text-sm font-semibold underline">
            Request a new reset link
          </Link>
        </div>
      ) : (
        <form
          noValidate
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            if (loading) return;
            const next = {
              password: password.length < 8 ? "Use at least 8 characters." : undefined,
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
    </AuthLayout>
  );
}
