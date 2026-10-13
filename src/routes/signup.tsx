import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthField";
import { AuthCard, AuthDivider, AuthHeading } from "@/components/auth/AuthCard";
import { AuthError } from "@/components/auth/AuthContent";
import { AuthBack } from "@/components/auth/AuthBack";
import { OtpInputs } from "@/components/auth/OtpInputs";
import { SocialButton } from "@/components/auth/SocialButton";
import { useAuthReady } from "@/components/auth/useAuthReady";
import { FacebookSignInButton } from "@/components/auth/FacebookSignInButton";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import {
  clearAuthError,
  clearPendingVerification,
  googleAuth,
  resendOtp,
  signup,
  verifyOtp,
} from "@/features/auth/authSlice";
import { getErrorMessage } from "@/lib/errors";
import { checkoutReturn } from "@/lib/auth-return";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "otp" ? "otp" : search.mode === "form" ? "form" : "choose",
    returnTo: checkoutReturn(search.returnTo ?? search.redirect),
  }),
  head: () => ({ meta: [{ title: "Create an account — AzarFaith" }] }),
  component: Signup,
});
type Errors = Partial<
  Record<"firstName" | "lastName" | "email" | "phone" | "password" | "terms" | "otp", string>
>;
const intro =
  "Give to verified churches, missions and orphanages across Nigeria, and see what every gift did.";

function Terms() {
  return (
    <p className="text-[13px] leading-[1.6] text-muted-ink">
      By continuing, you agree to AzarFaith&rsquo;s{" "}
      <Link
        to="/$page"
        params={{ page: "terms" }}
        className="text-ink-soft underline decoration-1 underline-offset-4 hover:text-ink"
      >
        terms
      </Link>
      ,{" "}
      <Link
        to="/$page"
        params={{ page: "privacy" }}
        className="text-ink-soft underline decoration-1 underline-offset-4 hover:text-ink"
      >
        privacy policy
      </Link>{" "}
      and{" "}
      <Link
        to="/$page"
        params={{ page: "cookies" }}
        className="text-ink-soft underline decoration-1 underline-offset-4 hover:text-ink"
      >
        cookie policy
      </Link>
      .
    </p>
  );
}

function Signup() {
  const navigate = useNavigate(),
    dispatch = useAppDispatch();
  const { mode, returnTo } = Route.useSearch();
  const { loading, pendingVerificationEmail, error, user, hydrated } = useAppSelector(
    (state) => state.auth,
  );
  const ready = useAuthReady();
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "+234",
    password: "",
  });
  const [terms, setTerms] = useState(false),
    [errors, setErrors] = useState<Errors>({});
  const [digits, setDigits] = useState(["", "", "", ""]),
    [countdown, setCountdown] = useState(30);
  const otpForm = useRef<HTMLFormElement>(null),
    lastAttempt = useRef("");
  const redirected = useRef(false);
  const code = digits.join(""),
    verifying = mode === "otp" && Boolean(pendingVerificationEmail);
  const go = (mode: "choose" | "form" | "otp") => {
    setErrors({});
    dispatch(clearAuthError());
    void navigate({ to: "/signup", search: { mode, returnTo } });
  };
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch, mode]);
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
  useEffect(() => {
    if (!verifying || countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [verifying, countdown]);
  // The original auto-advance now submits to verification, never authenticates locally.
  useEffect(() => {
    if (!verifying || !ready || loading || code.length !== 4 || lastAttempt.current === code)
      return;
    lastAttempt.current = code;
    otpForm.current?.requestSubmit();
  }, [verifying, ready, loading, code]);
  const update = (key: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const changeEmail = () => {
    dispatch(clearPendingVerification());
    setDigits(["", "", "", ""]);
    lastAttempt.current = "";
    go("form");
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading || !ready) return;
    const next: Errors = {},
      email = values.email.trim().toLowerCase(),
      phone = values.phone.replace(/\s+/g, "");
    if (!values.firstName.trim()) next.firstName = "Enter your first name";
    if (!values.lastName.trim()) next.lastName = "Enter your last name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address";
    if (!/^\+?[1-9]\d{7,14}$/.test(phone))
      next.phone = "Enter a phone number with its country code.";
    if (values.password.length < 8) next.password = "Use at least 8 characters";
    if (new TextEncoder().encode(values.password).length > 72)
      next.password = "Use a password no longer than 72 bytes.";
    if (!terms) next.terms = "Agree to the Terms and Privacy Policy to continue.";
    setErrors(next);
    if (Object.keys(next).length) return;
    dispatch(clearAuthError());
    try {
      await dispatch(
        signup({
          fullName: `${values.firstName.trim()} ${values.lastName.trim()}`,
          email,
          phone,
          password: values.password,
        }),
      ).unwrap();
      setCountdown(30);
      setDigits(["", "", "", ""]);
      lastAttempt.current = "";
      go("otp");
    } catch (err) {
      toast.error(getErrorMessage(err, "Signup failed"));
    }
  };
  return (
    <AuthLayout
      prompt="Already have an account?"
      linkLabel="Sign in"
      linkTo="/login"
      returnTo={returnTo}
    >
      {verifying ? (
        <AuthCard>
          <div className="flex flex-col gap-6">
            <AuthBack onClick={changeEmail} disabled={loading}>
              Back
            </AuthBack>
            <AuthHeading title="Check your email">
              We sent a 4-digit code to{" "}
              <span className="font-semibold text-ink">{pendingVerificationEmail}</span>. Enter it
              below to confirm your address, or{" "}
              <button
                type="button"
                onClick={changeEmail}
                disabled={loading}
                className="font-semibold text-ink underline decoration-1 underline-offset-4"
              >
                change your email
              </button>
              .
            </AuthHeading>
          </div>
          <form
            ref={otpForm}
            className="flex flex-col gap-4"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              if (loading || !ready) return;
              if (!/^\d{4}$/.test(code)) {
                setErrors({ otp: "Enter the complete 4-digit code." });
                return;
              }
              lastAttempt.current = code;
              dispatch(clearAuthError());
              try {
                await dispatch(verifyOtp({ email: pendingVerificationEmail!, code })).unwrap();
              } catch (err) {
                toast.error(getErrorMessage(err, "Verification failed"));
              }
            }}
          >
            <OtpInputs
              value={digits}
              onChange={(next) => {
                setDigits(next);
                setErrors({});
              }}
              disabled={loading}
              error={errors.otp}
            />
            <AuthError message={error} />
            <SocialButton variant="solid" type="submit" disabled={loading}>
              {loading ? "Verifying…" : "Verify email"}
            </SocialButton>
            <p className="text-[13px] text-muted-ink">
              Didn't receive it?{" "}
              <button
                type="button"
                disabled={!ready || loading || countdown > 0}
                className="font-medium text-ink underline disabled:no-underline disabled:opacity-50"
                onClick={async () => {
                  dispatch(clearAuthError());
                  try {
                    await dispatch(resendOtp({ email: pendingVerificationEmail! })).unwrap();
                    setCountdown(30);
                    setDigits(["", "", "", ""]);
                    lastAttempt.current = "";
                    toast.success("A new code has been sent.");
                  } catch (err) {
                    toast.error(getErrorMessage(err, "Could not resend the code"));
                  }
                }}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
              </button>
            </p>
          </form>
        </AuthCard>
      ) : mode === "form" ? (
        <AuthCard>
          <div className="flex flex-col gap-6">
            <AuthBack onClick={() => go("choose")} disabled={loading}>
              Back
            </AuthBack>
            <AuthHeading title="Create your account">{intro}</AuthHeading>
          </div>
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <AuthField
                label="First name"
                autoComplete="given-name"
                placeholder="Tunde"
                value={values.firstName}
                onChange={(event) => update("firstName", event.target.value)}
                error={errors.firstName}
                disabled={loading}
              />
              <AuthField
                label="Last name"
                autoComplete="family-name"
                placeholder="Adebayo"
                value={values.lastName}
                onChange={(event) => update("lastName", event.target.value)}
                error={errors.lastName}
                disabled={loading}
              />
            </div>
            <AuthField
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              error={errors.email}
              disabled={loading}
            />
            <AuthField
              label="Phone number"
              type="tel"
              autoComplete="tel"
              value={values.phone}
              onChange={(event) => update("phone", event.target.value)}
              error={errors.phone}
              disabled={loading}
            />
            <AuthField
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={values.password}
              onChange={(event) => update("password", event.target.value)}
              error={errors.password}
              disabled={loading}
            />
            <label className="flex items-center gap-2 text-[13px] text-muted-ink">
              <input
                type="checkbox"
                checked={terms}
                disabled={loading || !ready}
                onChange={(event) => {
                  setTerms(event.target.checked);
                  setErrors((current) => ({ ...current, terms: undefined }));
                }}
                className="h-4 w-4 accent-ink"
              />
              I agree to the Terms and Privacy Policy.
            </label>
            {errors.terms && (
              <p role="alert" className="font-gsf text-[13px] text-danger">
                {errors.terms}
              </p>
            )}
            <AuthError message={error} />
            <SocialButton variant="solid" type="submit" disabled={loading} className="mt-2">
              {loading ? "Creating your account…" : "Create account"}
            </SocialButton>
          </form>
          <Terms />
        </AuthCard>
      ) : (
        <AuthCard>
          <AuthHeading title="Create your account">{intro}</AuthHeading>
          {mode === "otp" && (
            <p role="status" className="text-[13px] text-muted-ink">
              Sign up again or sign in to request a fresh verification code.
            </p>
          )}
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
            <FacebookSignInButton disabled={loading} />
            <AuthDivider>or</AuthDivider>
            <SocialButton variant="solid" onClick={() => go("form")}>
              Continue with email
            </SocialButton>
          </div>
          <AuthError message={error} />
          <Terms />
        </AuthCard>
      )}
    </AuthLayout>
  );
}
