import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Shield } from "lucide-react";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { adminLogin, clearAuthError } from "@/features/auth/authSlice";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, hydrated, loading, error } = useAppSelector((state) => state.auth);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});

  useEffect(() => {
    if (!hydrated) return;

    if (user?.role === "platform_admin") {
      navigate({ to: "/admin", replace: true });
    }
  }, [hydrated, navigate, user]);

  const validateForm = () => {
    const nextErrors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      nextErrors.identifier = "Enter your admin email or phone number.";
    }

    if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <div className="hidden flex-1 border-r border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.35),_transparent_45%),linear-gradient(180deg,#111827_0%,#020617_100%)] p-12 lg:flex lg:flex-col lg:justify-center">
        <div className="max-w-lg">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
            <Shield className="h-8 w-8" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">
            AzarFaith Admin
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-white">
            Review campaigns, approve organizations, and manage platform trust.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-gray-300">
            This area is restricted to verified platform administrators only.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-14">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 text-gray-900 shadow-2xl">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">
              Admin sign in
            </p>
            <h2 className="mt-3 font-display text-3xl tracking-tight">Platform access</h2>
            <p className="mt-2 text-sm text-gray-500">
              Use your platform-admin credentials to enter the review console.
            </p>
          </div>

          <form
            className="space-y-5"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!validateForm()) return;

              dispatch(clearAuthError());

              try {
                await dispatch(adminLogin({ identifier, password })).unwrap();
                toast.success("Admin login successful");
                navigate({ to: "/admin" });
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Admin login failed");
              }
            }}
          >
            <div>
              <label className="text-sm font-medium text-gray-700">Email or phone</label>
              <input
                value={identifier}
                onChange={(event) => {
                  setIdentifier(event.target.value);
                  setFieldErrors((current) => ({ ...current, identifier: undefined }));
                }}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              {fieldErrors.identifier ? (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.identifier}</p>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setFieldErrors((current) => ({ ...current, password: undefined }));
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-500 hover:text-gray-800"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password ? (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              ) : null}
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Enter admin console"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <Link to="/login" className="font-medium text-amber-600 hover:text-amber-700">
              Return to donor login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
