import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import {
  clearAuthError,
  clearPendingVerification,
  googleAuth,
  resendOtp,
  signup,
  verifyOtp,
} from "@/features/auth/authSlice";
import { Eye, EyeOff, Flame, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "otp" ? "otp" : "form",
  }),
  component: Signup,
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[1-9]\d{7,14}$/;

type SignupErrors = {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  agreedToTerms?: string;
  otp?: string;
};

function Signup() {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const { mode } = Route.useSearch();
  const { loading, pendingVerificationEmail, error } = useAppSelector((state) => state.auth);
  const [step, setStep] = useState<"form" | "otp">(mode === "otp" ? "otp" : "form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+234");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [fieldErrors, setFieldErrors] = useState<SignupErrors>({});

  useEffect(() => {
    if (mode === "otp" && pendingVerificationEmail) {
      setStep("otp");
    }
  }, [mode, pendingVerificationEmail]);

  useEffect(() => {
    if (step !== "otp" || resendCountdown <= 0) return;

    const timer = window.setTimeout(() => {
      setResendCountdown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [step, resendCountdown]);

  const normalizedPhone = phone.replace(/\s+/g, "").trim();

  const validateSignupForm = () => {
    const nextErrors: SignupErrors = {};

    if (fullName.trim().length < 2) {
      nextErrors.fullName = "Enter your full name.";
    }
    if (!emailPattern.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!phonePattern.test(normalizedPhone)) {
      nextErrors.phone = "Enter a valid phone number.";
    }
    if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }
    if (!agreedToTerms) {
      nextErrors.agreedToTerms = "You must agree to the Terms and Privacy Policy.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateOtpForm = () => {
    if (otp.every((digit) => /^\d$/.test(digit))) {
      setFieldErrors((current) => ({ ...current, otp: undefined }));
      return true;
    }

    setFieldErrors((current) => ({
      ...current,
      otp: "Enter the complete 4-digit verification code.",
    }));
    return false;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignupForm()) return;

    dispatch(clearAuthError());
    try {
      await dispatch(signup({ fullName, email, phone: normalizedPhone, password })).unwrap();
      toast.success("Verification code sent to your email");
      setFieldErrors({});
      setResendCountdown(30);
      setStep("otp");
      nav({ to: "/signup", search: { mode: "otp" } });
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

    if (!validateOtpForm()) return;

    dispatch(clearAuthError());
    try {
      await dispatch(verifyOtp({ email: pendingVerificationEmail, code: otp.join("") })).unwrap();
      dispatch(clearPendingVerification());
      toast.success("Account verified");
      nav({ to: "/" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed";
      toast.error(message);
    }
  };

  const updateOtpDigit = (index: number, value: string) => {
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setFieldErrors((current) => ({ ...current, otp: undefined }));
  };

  const focusOtpInput = (index: number) => {
    const target = document.getElementById(`otp-${index}`);
    if (target) {
      (target as HTMLInputElement).focus();
      (target as HTMLInputElement).select();
    }
  };

  const handleOtpChange = (index: number, rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "");
    if (!digits) {
      updateOtpDigit(index, "");
      return;
    }

    if (digits.length === 1) {
      updateOtpDigit(index, digits);
      if (index < otp.length - 1) {
        focusOtpInput(index + 1);
      }
      return;
    }

    const next = [...otp];
    digits
      .slice(0, otp.length - index)
      .split("")
      .forEach((digit, offset) => {
        next[index + offset] = digit;
      });
    setOtp(next);
    setFieldErrors((current) => ({ ...current, otp: undefined }));
    focusOtpInput(Math.min(index + digits.length - 1, otp.length - 1));
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, otp.length);
    if (!digits) return;

    const next = [...otp];
    for (let i = 0; i < otp.length; i += 1) {
      next[i] = digits[i] ?? "";
    }
    setOtp(next);
    setFieldErrors((current) => ({ ...current, otp: undefined }));
    focusOtpInput(Math.min(digits.length - 1, otp.length - 1));
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      focusOtpInput(index - 1);
      return;
    }

    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusOtpInput(index - 1);
      return;
    }

    if (e.key === "ArrowRight" && index < otp.length - 1) {
      e.preventDefault();
      focusOtpInput(index + 1);
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
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setFieldErrors((current) => ({ ...current, fullName: undefined }));
                  }}
                  error={fieldErrors.fullName}
                />
                <Field
                  label="Email"
                  placeholder="you@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((current) => ({ ...current, email: undefined }));
                  }}
                  error={fieldErrors.email}
                />
                <div>
                  <label className="text-sm font-medium">Phone number</label>
                  <input
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setFieldErrors((current) => ({ ...current, phone: undefined }));
                    }}
                    className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                  {fieldErrors.phone && <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Password</label>
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
                {error && <p className="text-sm text-red-600">{error}</p>}
                <label className="flex items-start gap-3 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      setFieldErrors((current) => ({ ...current, agreedToTerms: undefined }));
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-amber-500"
                  />
                  <span>By continuing you agree to our Terms and Privacy Policy.</span>
                </label>
                {fieldErrors.agreedToTerms && (
                  <p className="-mt-3 text-sm text-red-600">{fieldErrors.agreedToTerms}</p>
                )}
                <button
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-amber-500 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition hover:bg-amber-600"
                >
                  {loading ? "Sending code…" : "Continue"}
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
                      toast.success("Account ready");
                      nav({ to: "/" });
                    } catch (err) {
                      const message = err instanceof Error ? err.message : "Google sign-in failed";
                      toast.error(message);
                    }
                  }}
                />
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
                      inputMode="numeric"
                      autoComplete={i === 0 ? "one-time-code" : "off"}
                      maxLength={4}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onPaste={handleOtpPaste}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      id={`otp-${i}`}
                      className="w-14 h-16 text-center text-2xl font-display rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  ))}
                </div>
                {fieldErrors.otp && <p className="mt-3 text-sm text-center text-red-600">{fieldErrors.otp}</p>}
                <button
                  onClick={verify}
                  disabled={loading}
                  className="mt-8 w-full py-3.5 rounded-xl bg-amber-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-600"
                >
                  {loading ? "Verifying…" : "Verify & continue"}
                </button>
                <button
                  onClick={() => {
                    dispatch(clearPendingVerification());
                    setStep("form");
                    nav({ to: "/signup", search: { mode: "form" } });
                  }}
                  className="mt-3 w-full py-3 text-sm text-muted-foreground"
                >
                  Wrong email? Edit
                </button>
                <div className="mt-2 text-center text-xs text-muted-foreground">
                  {resendCountdown > 0 ? (
                    <p>Didn't get it? Resend in {resendCountdown}s</p>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!pendingVerificationEmail) {
                          toast.error("No pending verification email found");
                          return;
                        }

                        dispatch(clearAuthError());
                        try {
                          await dispatch(
                            resendOtp({ email: pendingVerificationEmail }),
                          ).unwrap();
                          setResendCountdown(30);
                          toast.success("A new verification code has been sent.");
                        } catch (err) {
                          const message =
                            err instanceof Error ? err.message : "Resend failed";
                          toast.error(message);
                        }
                      }}
                      disabled={loading}
                      className="font-medium text-amber-600 hover:text-amber-700 disabled:opacity-60"
                    >
                      Resend code
                    </button>
                  )}
                </div>
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
  error,
  ...props
}: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        {...props}
        className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
