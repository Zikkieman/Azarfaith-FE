import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { clearAuthError, resetPassword } from "@/features/auth/authSlice";
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
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearAuthError());

    if (!token) {
      toast.error("Reset token is missing from the link");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

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
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Confirm password</label>
                <input
                  type="password"
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-amber-500 text-white font-semibold transition hover:bg-amber-600 disabled:opacity-60"
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
