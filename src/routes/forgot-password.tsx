import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthField";
import { AuthCard, AuthHeading } from "@/components/auth/AuthCard";
import { AuthError } from "@/components/auth/AuthContent";
import { SocialButton } from "@/components/auth/SocialButton";
import { btn } from "@/components/app/btn";
import { cn } from "@/lib/utils";
import { clearAuthError, forgotPassword } from "@/features/auth/authSlice";
import { getErrorMessage } from "@/lib/errors";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset your password — AzarFaith" }] }),
  component: ForgotPassword,
});
function ForgotPassword() {
  const dispatch = useAppDispatch(),
    { loading, error } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState(""),
    [fieldError, setFieldError] = useState<string>(),
    [sentTo, setSentTo] = useState<string | null>(null);
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);
  return (
    <AuthLayout prompt="Remember your password?" linkLabel="Sign in" linkTo="/login">
      <AuthCard>
        {sentTo ? (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-panel text-ink">
              <MailCheck className="h-6 w-6" strokeWidth={1.5} />
            </span>
            <AuthHeading title="Check your inbox">
              If an account exists for <span className="font-semibold text-ink">{sentTo}</span>, a
              reset link is on its way. It expires in 30 minutes.
            </AuthHeading>
            <div className="flex flex-col gap-3">
              <Link to="/login" className={cn(btn("primary", "lg"), "w-full")}>
                Back to sign in
              </Link>
              <SocialButton
                onClick={() => {
                  setSentTo(null);
                  dispatch(clearAuthError());
                }}
              >
                Use a different email
              </SocialButton>
            </div>
          </>
        ) : (
          <>
            <AuthHeading title="Reset your password">
              Enter the email you signed up with and we&rsquo;ll send you a link to choose a new
              password.
            </AuthHeading>
            <form
              className="flex flex-col gap-4"
              noValidate
              onSubmit={async (event) => {
                event.preventDefault();
                if (loading) return;
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                  setFieldError("Enter a valid email address");
                  return;
                }
                dispatch(clearAuthError());
                try {
                  const normalized = email.trim().toLowerCase();
                  await dispatch(forgotPassword({ email: normalized })).unwrap();
                  setSentTo(normalized);
                } catch (err) {
                  toast.error(getErrorMessage(err, "Could not send a reset link"));
                }
              }}
            >
              <AuthField
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                disabled={loading}
                error={fieldError}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldError(undefined);
                }}
              />
              <AuthError message={error} />
              <SocialButton variant="solid" type="submit" disabled={loading} className="mt-2">
                {loading ? "Sending…" : "Send reset link"}
              </SocialButton>
            </form>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
