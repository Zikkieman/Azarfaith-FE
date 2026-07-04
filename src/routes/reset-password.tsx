import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { clearAuthError, resetPassword } from "@/features/auth/authSlice";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const { token } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const validateForm = () => {
    const nextErrors: { password?: string; confirmPassword?: string } = {};

    if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }
    if (confirmPassword.length < 8) {
      nextErrors.confirmPassword = "Confirm your new password.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearAuthError());

    if (!token) {
      toast.error("Reset token is missing from the link");
      return;
    }

    if (!validateForm()) return;

    try {
      await dispatch(resetPassword({ token, password })).unwrap();
      setDone(true);
      toast.success("Password reset successful");
      window.setTimeout(() => {
        nav({ to: "/login" });
      }, 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Password reset failed";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl tracking-tight">Choose a new password</h1>
          <p className="mt-2 text-muted-foreground">
            Enter a new password for your AzarFaith account.
          </p>

          {done ? (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
              Password reset successful. Redirecting you to login.
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-5">
              <div>
                <label className="text-sm font-medium">New password</label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErrors((current) => ({ ...current, password: undefined }));
                    }}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Confirm password</label>
                <div className="relative mt-1.5">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
                    }}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>}
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-amber-500 text-white font-semibold transition hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Updating password..." : "Reset password"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Back to{" "}
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
