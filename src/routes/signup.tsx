import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { clearAuthError, signup, verifyOtp } from "@/features/auth/authSlice";
import { Flame, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({ component: Signup });

function Signup() {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, pendingVerificationEmail, error } = useAppSelector((state) => state.auth);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+234");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearAuthError());
    try {
      await dispatch(signup({ fullName, email, phone, password })).unwrap();
      toast.success("Verification code sent to your email");
      setStep("otp");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      toast.error(message);
    }
  };

  const verify = async () => {
    if (!pendingVerificationEmail) {
      toast.error("No pending verification email found");
      return;
    }

    dispatch(clearAuthError());
    try {
      await dispatch(verifyOtp({ email: pendingVerificationEmail, code: otp.join("") })).unwrap();
      toast.success("Account verified");
      nav({ to: "/" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed";
      toast.error(message);
    }
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
            <h2 className="font-display text-3xl tracking-tight">Start giving faithfully</h2>
            <p className="mt-4 text-white/80 text-lg leading-relaxed">
              Create your free account and support churches, missionaries, and faith-based
              organizations across Nigeria.
            </p>
            <div className="mt-8 flex items-center gap-6 text-white/70 text-sm">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Verified
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Transparent
              </span>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center px-6 py-14 md:px-16">
          <div className="w-full max-w-md mx-auto">
            <h1 className="font-display text-3xl tracking-tight">
              {step === "form" ? "Create your account" : "Verify your email"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {step === "form"
                ? "Join the community supporting faith-based causes."
                : `We sent a 4-digit code to ${pendingVerificationEmail ?? email}`}
            </p>
            {step === "form" ? (
              <form onSubmit={submit} className="mt-8 space-y-5">
                <Field
                  label="Full name"
                  placeholder="e.g. Tunde Adebayo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <Field
                  label="Email"
                  placeholder="you@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div>
                  <label className="text-sm font-medium">Phone number</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <Field
                  label="Password"
                  placeholder="At least 8 characters"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <p className="text-xs text-muted-foreground">
                  By continuing you agree to our Terms and Privacy Policy.
                </p>
                <button
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-amber-500 text-white font-semibold disabled:opacity-60 transition hover:bg-amber-600"
                >
                  {loading ? "Sending code…" : "Continue"}
                </button>
                <div className="flex items-center gap-3 my-3">
                  <span className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <span className="flex-1 h-px bg-border" />
                </div>
                <button
                  type="button"
                  onClick={() => toast.info("Google signup is not wired yet")}
                  className="w-full py-3.5 rounded-xl bg-card border border-border font-medium flex items-center justify-center gap-2 hover:bg-muted transition"
                >
                  <GoogleIcon /> Continue with Google
                </button>
                <p className="text-center text-sm text-muted-foreground pt-2">
                  Already have an account?{" "}
                  <Link to="/login" className="text-amber-600 font-medium hover:underline">
                    Log in
                  </Link>
                </p>
              </form>
            ) : (
              <div className="mt-8">
                <div className="flex gap-3 justify-center">
                  {otp.map((v, i) => (
                    <input
                      key={i}
                      value={v}
                      maxLength={1}
                      onChange={(e) => {
                        const next = [...otp];
                        next[i] = e.target.value.replace(/\D/g, "");
                        setOtp(next);
                        const n = document.getElementById(`otp-${i + 1}`);
                        if (e.target.value && n) (n as HTMLInputElement).focus();
                      }}
                      id={`otp-${i}`}
                      className="w-14 h-16 text-center text-2xl font-display rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  ))}
                </div>
                <button
                  onClick={verify}
                  disabled={loading || otp.some((d) => !d)}
                  className="mt-8 w-full py-3.5 rounded-xl bg-amber-500 text-white font-semibold disabled:opacity-50 hover:bg-amber-600"
                >
                  {loading ? "Verifying…" : "Verify & continue"}
                </button>
                <button
                  onClick={() => setStep("form")}
                  className="mt-3 w-full py-3 text-sm text-muted-foreground"
                >
                  Wrong email? Edit
                </button>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Didn't get it? Resend in 30s
                </p>
                {error && <p className="text-sm text-red-600 text-center mt-3">{error}</p>}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        {...props}
        className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
      />
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
