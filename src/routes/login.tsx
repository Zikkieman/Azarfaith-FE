import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { clearAuthError, googleAuth, login, setPendingVerificationEmail } from "@/features/auth/authSlice";
import { Eye, EyeOff, Flame } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: Login,
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});

  const validateForm = () => {
    const nextErrors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      nextErrors.identifier = "Enter your email or phone number.";
    }
    if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

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
                if (!validateForm()) return;

                dispatch(clearAuthError());
                try {
                  await dispatch(login({ identifier, password })).unwrap();
                  toast.success("Login successful");
                  nav({ to: "/" });
                } catch (err) {
                  const message = err instanceof Error ? err.message : "Login failed";
                  const normalizedIdentifier = identifier.trim().toLowerCase();

                  if (
                    message.includes("not verified") &&
                    emailPattern.test(normalizedIdentifier)
                  ) {
                    dispatch(setPendingVerificationEmail(normalizedIdentifier));
                    toast.info("Enter the verification code sent to your email.");
                    nav({ to: "/signup", search: { mode: "otp" } });
                    return;
                  }

                  toast.error(message);
                }
              }}
              className="mt-8 space-y-5"
            >
              <div>
                <label className="text-sm font-medium">Email or phone</label>
                <input
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setFieldErrors((current) => ({ ...current, identifier: undefined }));
                  }}
                  className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
                {fieldErrors.identifier && <p className="mt-1 text-sm text-red-600">{fieldErrors.identifier}</p>}
              </div>
              <div>
                <label className="text-sm font-medium flex justify-between">
                  Password{" "}
                  <Link to="/forgot-password" className="text-xs text-amber-600">
                    Forgot?
                  </Link>
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? "text" : "password"}
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition bg-amber-500 text-white hover:bg-amber-600"
              >
                {loading ? "Signing in…" : "Log in"}
              </button>
              <div className="flex items-center gap-3 my-3">
                <span className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <span className="flex-1 h-px bg-border" />
              </div>
              <GoogleSignInButton
                disabled={loading}
                onCredential={async (idToken) => {
                  dispatch(clearAuthError());
                  try {
                    await dispatch(googleAuth({ idToken })).unwrap();
                    toast.success("Login successful");
                    nav({ to: "/" });
                  } catch (err) {
                    const message = err instanceof Error ? err.message : "Google sign-in failed";
                    toast.error(message);
                  }
                }}
              />
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
