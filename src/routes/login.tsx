import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthField";
import { AuthButton, AuthDivider, AuthError, AuthHeading } from "@/components/auth/AuthContent";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import {
  clearAuthError,
  googleAuth,
  login,
  setPendingVerificationEmail,
} from "@/features/auth/authSlice";
import { getErrorMessage } from "@/lib/errors";
import { checkoutReturn } from "@/lib/auth-return";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { returnTo?: string } => ({
    returnTo: checkoutReturn(search.returnTo),
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { returnTo } = Route.useSearch();
  const finish = () =>
    returnTo ? window.location.assign(returnTo) : navigate({ to: "/dashboard" });
  const { loading, error } = useAppSelector((state) => state.auth);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  return (
    <AuthLayout
      prompt="New here?"
      linkLabel="Create an account"
      linkTo="/signup"
      returnTo={returnTo}
    >
      <AuthHeading title="Welcome back">
        Sign in to follow the causes you support and manage your giving.
      </AuthHeading>
      <div className="space-y-6">
        <GoogleSignInButton
          disabled={loading}
          onCredential={async (idToken) => {
            dispatch(clearAuthError());
            try {
              await dispatch(googleAuth({ idToken })).unwrap();
              finish();
            } catch (err) {
              toast.error(getErrorMessage(err, "Google sign-in failed"));
            }
          }}
        />
        <AuthDivider />
        <form
          noValidate
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            if (loading) return;
            const next = {
              identifier: identifier.trim() ? undefined : "Enter your email or phone number.",
              password: password ? undefined : "Enter your password.",
            };
            setFieldErrors(next);
            if (next.identifier || next.password) return;
            dispatch(clearAuthError());
            try {
              await dispatch(login({ identifier: identifier.trim(), password })).unwrap();
              finish();
            } catch (err) {
              const message = getErrorMessage(err, "Login failed");
              const email = identifier.trim().toLowerCase();
              if (message.includes("not verified") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                dispatch(setPendingVerificationEmail(email));
                navigate({ to: "/signup", search: { mode: "otp", returnTo } });
                return;
              }
              toast.error(message);
            }
          }}
        >
          <AuthField
            label="Email or phone"
            autoComplete="username"
            value={identifier}
            error={fieldErrors.identifier}
            onChange={(event) => {
              setIdentifier(event.target.value);
              setFieldErrors((current) => ({ ...current, identifier: undefined }));
            }}
          />
          <AuthField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            error={fieldErrors.password}
            action={
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-[#130e30] underline underline-offset-4"
              >
                Forgot password?
              </Link>
            }
            onChange={(event) => {
              setPassword(event.target.value);
              setFieldErrors((current) => ({ ...current, password: undefined }));
            }}
          />
          <AuthError message={error} />
          <AuthButton disabled={loading}>{loading ? "Signing in..." : "Sign in"}</AuthButton>
        </form>
      </div>
    </AuthLayout>
  );
}
