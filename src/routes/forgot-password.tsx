import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthField";
import { AuthButton, AuthError, AuthHeading } from "@/components/auth/AuthContent";
import { clearAuthError, forgotPassword } from "@/features/auth/authSlice";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPassword });

function ForgotPassword() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string>();
  const [sent, setSent] = useState(false);
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  return (
    <AuthLayout prompt="Remember your password?" linkLabel="Sign in" linkTo="/login">
      <AuthHeading title={sent ? "Check your inbox" : "Forgot your password?"}>
        {sent
          ? "If an account exists for that email, we've sent a reset link. Check your spam folder too."
          : "Enter the email you signed up with and we'll send you a reset link."}
      </AuthHeading>
      {sent ? (
        <div className="space-y-6">
          <p role="status" className="text-sm leading-relaxed text-[#667085]">
            The reset link expires after 30 minutes.
          </p>
          <AuthButton type="button" onClick={() => setSent(false)}>
            Try another email
          </AuthButton>
        </div>
      ) : (
        <form
          noValidate
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            if (loading) return;
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
              setFieldError("Enter a valid email address.");
              return;
            }
            dispatch(clearAuthError());
            try {
              await dispatch(forgotPassword({ email: email.trim().toLowerCase() })).unwrap();
              setSent(true);
            } catch (err) {
              toast.error(getErrorMessage(err, "Could not send a reset link"));
            }
          }}
        >
          <AuthField
            label="Email address"
            type="email"
            autoComplete="email"
            value={email}
            error={fieldError}
            onChange={(event) => {
              setEmail(event.target.value);
              setFieldError(undefined);
            }}
          />
          <AuthError message={error} />
          <AuthButton disabled={loading}>{loading ? "Sending..." : "Send reset link"}</AuthButton>
        </form>
      )}
    </AuthLayout>
  );
}
