import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthField";
import { AuthCard, AuthDivider, AuthHeading } from "@/components/auth/AuthCard";
import { AuthError } from "@/components/auth/AuthContent";
import { SocialButton } from "@/components/auth/SocialButton";
import { UnavailableFacebook } from "@/components/auth/UnavailableFacebook";
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
    returnTo: checkoutReturn(search.returnTo ?? search.redirect),
  }),
  head: () => ({ meta: [{ title: "Sign in — AzarFaith" }] }),
  component: Login,
});
function Login() {
  const navigate = useNavigate(),
    dispatch = useAppDispatch();
  const { returnTo } = Route.useSearch();
  const { loading, error, user, hydrated } = useAppSelector((state) => state.auth);
  const [identifier, setIdentifier] = useState(""),
    [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const redirected = useRef(false);
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);
  useEffect(() => {
    if (hydrated && user && !redirected.current) {
      redirected.current = true;
      if (returnTo) void navigate({ href: returnTo, replace: true });
      else
        void navigate({
          to: user.role === "platform_admin" ? "/admin" : "/dashboard",
          replace: true,
        });
    }
  }, [hydrated, user, navigate, returnTo]);
  return (
    <AuthLayout
      prompt="New to AzarFaith?"
      linkLabel="Create an account"
      linkTo="/signup"
      returnTo={returnTo}
    >
      <AuthCard>
        <AuthHeading title="Welcome back">
          Sign in to give, manage your regular gifts and follow the causes you care about.
        </AuthHeading>
        <div className="flex flex-col gap-3">
          <GoogleSignInButton
            appearance="designer"
            disabled={loading}
            onCredential={async (idToken) => {
              dispatch(clearAuthError());
              try {
                await dispatch(googleAuth({ idToken })).unwrap();
              } catch (err) {
                toast.error(getErrorMessage(err, "Google sign-in failed"));
              }
            }}
          />
          <UnavailableFacebook />
        </div>
        <AuthDivider>or sign in with email</AuthDivider>
        <form
          className="flex flex-col gap-4"
          noValidate
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
            } catch (err) {
              const message = getErrorMessage(err, "Login failed"),
                email = identifier.trim().toLowerCase();
              if (/not verified/i.test(message) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                dispatch(setPendingVerificationEmail(email));
                navigate({ to: "/signup", search: { mode: "otp", returnTo } });
                return;
              }
              toast.error(message);
            }
          }}
        >
          <AuthField
            id="email"
            label="Email or phone"
            autoComplete="username"
            placeholder="you@email.com"
            value={identifier}
            error={fieldErrors.identifier}
            disabled={loading}
            onChange={(event) => {
              setIdentifier(event.target.value);
              setFieldErrors((current) => ({ ...current, identifier: undefined }));
            }}
          />
          <div className="flex flex-col gap-2">
            <AuthField
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              error={fieldErrors.password}
              disabled={loading}
              onChange={(event) => {
                setPassword(event.target.value);
                setFieldErrors((current) => ({ ...current, password: undefined }));
              }}
            />
            <Link
              to="/forgot-password"
              className="self-end text-[13px] font-medium text-ink-soft underline decoration-1 underline-offset-4 hover:text-ink"
            >
              Forgot your password?
            </Link>
          </div>
          <AuthError message={error} />
          <SocialButton variant="solid" type="submit" disabled={loading} className="mt-2">
            {loading ? "Signing in…" : "Sign in"}
          </SocialButton>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
