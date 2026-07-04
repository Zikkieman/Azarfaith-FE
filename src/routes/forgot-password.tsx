import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { clearAuthError, forgotPassword } from "@/features/auth/authSlice";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPassword });

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPassword() {
  const dispatch = useAppDispatch();
  const { loading, forgotPasswordSent, error } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const validateForm = () => {
    if (emailPattern.test(email.trim())) {
      setFieldError(null);
      return true;
    }

    setFieldError("Enter a valid email address.");
    return false;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl tracking-tight">Reset your password</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your email and we'll send you a link to reset your password.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!validateForm()) return;

              dispatch(clearAuthError());
              try {
                await dispatch(forgotPassword({ email })).unwrap();
                toast.success("If the account exists, a reset link has been sent.");
              } catch (err) {
                const message = err instanceof Error ? err.message : "Request failed";
                toast.error(message);
              }
            }}
            className="mt-8 space-y-5"
          >
            <div>
              <label className="text-sm font-medium">Email address</label>
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldError(null);
                }}
                className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              {fieldError && <p className="mt-1 text-sm text-red-600">{fieldError}</p>}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {forgotPasswordSent && (
              <p className="text-sm text-emerald-700">
                If an account exists for that email, a reset link has been sent.
              </p>
            )}
            <button
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-amber-500 text-white font-semibold transition hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link to="/login" className="text-amber-600 font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
