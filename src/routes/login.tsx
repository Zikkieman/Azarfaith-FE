import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { clearAuthError, login } from "@/features/auth/authSlice";
import { Flame } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [identifier, setIdentifier] = useState("tunde@azarfaith.com");
  const [password, setPassword] = useState("demo1234");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex">
        <div className="hidden md:flex flex-1 flex-col justify-center items-center bg-gradient-to-br from-amber-500 to-amber-600 text-white p-12">
          <div className="max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur grid place-items-center mb-6">
              <Flame className="w-8 h-8 fill-white text-white" />
            </div>
            <h2 className="font-display text-3xl tracking-tight">Welcome back</h2>
            <p className="mt-4 text-white/80 text-lg leading-relaxed">
              Sign in to give, manage your recurring support, and track the causes you care about.
            </p>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center px-6 py-14 md:px-16">
          <div className="w-full max-w-md mx-auto">
            <h1 className="font-display text-3xl tracking-tight">Log in</h1>
            <p className="mt-2 text-muted-foreground">
              Enter your credentials to access your account.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                dispatch(clearAuthError());
                try {
                  await dispatch(login({ identifier, password })).unwrap();
                  toast.success("Login successful");
                  nav({ to: "/" });
                } catch (err) {
                  const message = err instanceof Error ? err.message : "Login failed";
                  toast.error(message);
                }
              }}
              className="mt-8 space-y-5"
            >
              <div>
                <label className="text-sm font-medium">Email or phone</label>
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium flex justify-between">
                  Password{" "}
                  <Link to="/forgot-password" className="text-xs text-amber-600">
                    Forgot?
                  </Link>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold disabled:opacity-60 transition bg-amber-500 text-white hover:bg-amber-600"
              >
                {loading ? "Signing in…" : "Log in"}
              </button>
              <div className="flex items-center gap-3 my-3">
                <span className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <span className="flex-1 h-px bg-border" />
              </div>
              <button
                type="button"
                onClick={() => toast.info("Google login is not wired yet")}
                className="w-full py-3.5 rounded-xl bg-card border border-border font-medium flex items-center justify-center gap-2 hover:bg-muted transition"
              >
                <GoogleIcon /> Continue with Google
              </button>
            </form>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              New here?{" "}
              <Link to="/signup" className="font-medium hover:underline text-amber-600">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
