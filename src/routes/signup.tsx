import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthField";
import { AuthButton, AuthDivider, AuthError, AuthHeading } from "@/components/auth/AuthContent";
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
    mode: search.mode === "otp" ? "otp" : "form",
    returnTo: checkoutReturn(search.returnTo),
  }),
  component: Signup,
});

type Errors = Partial<
  Record<"fullName" | "email" | "phone" | "password" | "terms" | "otp", string>
>;

function Signup() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { mode, returnTo } = Route.useSearch();
  const finish = () =>
    returnTo ? window.location.assign(returnTo) : navigate({ to: "/dashboard" });
  const { loading, pendingVerificationEmail, error } = useAppSelector((state) => state.auth);
  const [values, setValues] = useState({ fullName: "", email: "", phone: "+234", password: "" });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(30);
  const otpInput = useRef<HTMLInputElement>(null);
  const verifying = mode === "otp" && Boolean(pendingVerificationEmail);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch, mode]);
  useEffect(() => {
    if (!verifying || countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [verifying, countdown]);

  const update = (key: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    const next: Errors = {};
    const email = values.email.trim().toLowerCase();
    const phone = values.phone.replace(/\s+/g, "");
    if (values.fullName.trim().length < 2) next.fullName = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";
    if (!/^\+?[1-9]\d{7,14}$/.test(phone))
      next.phone = "Enter a phone number with its country code.";
    if (values.password.length < 8) next.password = "Use at least 8 characters.";
    if (!terms) next.terms = "Agree to the Terms and Privacy Policy to continue.";
    setErrors(next);
    if (Object.keys(next).length) return;
    dispatch(clearAuthError());
    try {
      await dispatch(
        signup({ ...values, fullName: values.fullName.trim(), email, phone }),
      ).unwrap();
      setCountdown(30);
      setOtp("");
      navigate({ to: "/signup", search: { mode: "otp", returnTo } });
    } catch (err) {
      toast.error(getErrorMessage(err, "Signup failed"));
    }
  };

  return (
    <AuthLayout prompt="Already a member?" linkLabel="Sign in" linkTo="/login" returnTo={returnTo}>
      <AuthHeading title={verifying ? "Check your email" : "Create your account"}>
        {verifying
          ? `Enter the 4-digit verification code sent to ${pendingVerificationEmail}.`
          : "A place to support the causes you believe in."}
      </AuthHeading>
      {verifying ? (
        <form
          className="space-y-6"
          noValidate
          onSubmit={async (event) => {
            event.preventDefault();
            if (loading) return;
            if (!/^\d{4}$/.test(otp)) {
              setErrors({ otp: "Enter the complete 4-digit code." });
              return;
            }
            dispatch(clearAuthError());
            try {
              await dispatch(verifyOtp({ email: pendingVerificationEmail!, code: otp })).unwrap();
              finish();
            } catch (err) {
              toast.error(getErrorMessage(err, "Verification failed"));
            }
          }}
        >
          <div className="relative">
            <label htmlFor="verification-code" className="sr-only">
              4-digit verification code
            </label>
            <input
              id="verification-code"
              ref={otpInput}
              value={otp}
              onChange={(event) => {
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 4));
                setErrors({});
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              disabled={loading}
              autoFocus
              aria-invalid={Boolean(errors.otp)}
              aria-describedby={errors.otp ? "otp-error" : undefined}
              className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
            />
            <div
              className="grid grid-cols-4 gap-3 rounded-xl focus-within:ring-2 focus-within:ring-[#130e30]/20"
              aria-hidden="true"
            >
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className={`grid h-16 place-items-center rounded-xl border text-2xl ${errors.otp ? "border-red-500" : "border-[#d0d5dd]"}`}
                >
                  {otp[index] ?? ""}
                </span>
              ))}
            </div>
          </div>
          {errors.otp && (
            <p id="otp-error" className="text-sm text-red-600">
              {errors.otp}
            </p>
          )}
          <AuthError message={error} />
          <AuthButton disabled={loading}>{loading ? "Verifying..." : "Verify email"}</AuthButton>
          <p className="text-center text-sm text-[#667085]">
            Didn't receive it?{" "}
            <button
              type="button"
              disabled={loading || countdown > 0}
              className="font-medium text-[#130e30] underline disabled:no-underline disabled:opacity-60"
              onClick={async () => {
                dispatch(clearAuthError());
                try {
                  await dispatch(resendOtp({ email: pendingVerificationEmail! })).unwrap();
                  setCountdown(30);
                  toast.success("A new code has been sent.");
                } catch (err) {
                  toast.error(getErrorMessage(err, "Could not resend the code"));
                }
              }}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
            </button>
          </p>
          <button
            type="button"
            disabled={loading}
            className="w-full text-sm text-[#667085] underline"
            onClick={() => {
              dispatch(clearPendingVerification());
              setOtp("");
              navigate({ to: "/signup", search: { mode: "form", returnTo } });
            }}
          >
            Use a different email
          </button>
        </form>
      ) : (
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
          {mode === "otp" && !pendingVerificationEmail && (
            <p role="status" className="text-sm text-[#667085]">
              Sign up again or sign in to request a fresh verification code.
            </p>
          )}
          <form noValidate onSubmit={submit} className="space-y-5">
            <AuthField
              label="Full name"
              autoComplete="name"
              value={values.fullName}
              error={errors.fullName}
              onChange={(event) => update("fullName", event.target.value)}
            />
            <AuthField
              label="Email address"
              type="email"
              autoComplete="email"
              value={values.email}
              error={errors.email}
              onChange={(event) => update("email", event.target.value)}
            />
            <AuthField
              label="Phone number"
              type="tel"
              autoComplete="tel"
              value={values.phone}
              error={errors.phone}
              onChange={(event) => update("phone", event.target.value)}
            />
            <AuthField
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={values.password}
              error={errors.password}
              onChange={(event) => update("password", event.target.value)}
            />
            <label className="flex items-start gap-3 text-sm leading-relaxed text-[#667085]">
              <input
                type="checkbox"
                checked={terms}
                onChange={(event) => {
                  setTerms(event.target.checked);
                  setErrors((current) => ({ ...current, terms: undefined }));
                }}
                className="mt-1 h-4 w-4 shrink-0 accent-[#130e30]"
              />
              I agree to the Terms and Privacy Policy.
            </label>
            {errors.terms && <p className="text-sm text-red-600">{errors.terms}</p>}
            <AuthError message={error} />
            <AuthButton disabled={loading}>
              {loading ? "Sending code..." : "Create account"}
            </AuthButton>
          </form>
        </div>
      )}
    </AuthLayout>
  );
}
