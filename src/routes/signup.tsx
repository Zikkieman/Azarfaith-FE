import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AuthCard, AuthDivider, AuthHeading } from "@/components/auth/AuthCard";
import { AuthField } from "@/components/auth/AuthField";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { BackLink } from "@/components/app/AppShell";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { OtpInputs } from "@/components/auth/OtpInputs";
import { SocialButton } from "@/components/auth/SocialButton";
import facebookIcon from "@/assets/signup/facebook-icon.svg";
import { apiFetch, API_BASE_URL } from "@/lib/api";
import { useAuth, type AuthUser } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>): { mode?: Step } => ({
    mode: s.mode === "form" || s.mode === "otp" ? s.mode : undefined,
  }),
  head: () => ({ meta: [{ title: "Create an account — AzarFaith" }] }),
  component: Signup,
});

type Step = "choose" | "form" | "otp";
type Values = { firstName: string; lastName: string; email: string; phone: string; password: string };
const intro = "Give to verified churches, missions and orphanages across Nigeria, and see what every gift did.";
const errorMessage = (error: unknown, fallback: string) => error instanceof Error && error.message ? error.message : fallback;

function Signup() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { user, setUser } = useAuth();
  const [step, setStep] = useState<Step>(search.mode ?? "choose");
  const [values, setValues] = useState<Values>({ firstName: "", lastName: "", email: "", phone: "+234", password: "" });
  const [terms, setTerms] = useState(false);
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const attempted = useRef("");
  const email = values.email.trim().toLowerCase();

  useEffect(() => {
    if (user) void navigate({ to: user.role === "platform_admin" ? "/admin" : "/dashboard", replace: true });
  }, [navigate, user]);
  useEffect(() => {
    if (!countdown) return;
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const go = (next: Step) => {
    setStep(next);
    void navigate({ to: "/signup", search: { mode: next }, replace: true });
  };
  const update = (key: keyof Values, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const complete = (next: AuthUser) => {
    setUser(next);
    void navigate({ to: next.role === "platform_admin" ? "/admin" : "/dashboard", replace: true });
  };
  const google = async (idToken: string) => {
    setLoading(true);
    try {
      const result = await apiFetch<{ user: AuthUser }>("/auth/google", { method: "POST", body: JSON.stringify({ idToken }) });
      complete(result.user);
    } catch (error) {
      toast.error(errorMessage(error, "Google sign-in failed"));
    } finally {
      setLoading(false);
    }
  };
  const signup = async (event: FormEvent) => {
    event.preventDefault();
    const phone = values.phone.replace(/\s+/g, "");
    if (!values.firstName.trim() || !values.lastName.trim()) return toast.error("Enter your first and last name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Enter a valid email address.");
    if (!/^\+?[1-9]\d{7,14}$/.test(phone)) return toast.error("Enter a valid phone number with its country code.");
    if (values.password.length < 8) return toast.error("Use a password of at least 8 characters.");
    if (!terms) return toast.error("Agree to the Terms and Privacy Policy to continue.");
    setLoading(true);
    try {
      await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ fullName: `${values.firstName.trim()} ${values.lastName.trim()}`, email, phone, password: values.password }),
      });
      attempted.current = "";
      setDigits(["", "", "", ""]);
      setCountdown(30);
      go("otp");
    } catch (error) {
      toast.error(errorMessage(error, "Could not create your account"));
    } finally {
      setLoading(false);
    }
  };
  const verify = async (event?: FormEvent) => {
    event?.preventDefault();
    const code = digits.join("");
    if (!/^\d{4}$/.test(code)) return toast.error("Enter the complete 4-digit code.");
    setLoading(true);
    try {
      const result = await apiFetch<{ user: AuthUser }>("/auth/verify-otp", { method: "POST", body: JSON.stringify({ email, code }) });
      complete(result.user);
    } catch (error) {
      attempted.current = "";
      toast.error(errorMessage(error, "Verification failed"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const code = digits.join("");
    if (step === "otp" && code.length === 4 && !loading && attempted.current !== code) {
      attempted.current = code;
      void verify();
    }
  }, [digits, loading, step]);

  return (
    <AuthLayout prompt="Already have an account?" linkLabel="Sign in" linkTo="/login">
      {step === "choose" ? <Choose onEmail={() => go("form")} onFacebook={() => window.location.assign(`${API_BASE_URL}/auth/facebook/start`)} onGoogle={google} loading={loading} /> : null}
      {step === "form" ? <Form values={values} loading={loading} terms={terms} update={update} setTerms={setTerms} onBack={() => go("choose")} onSubmit={signup} /> : null}
      {step === "otp" ? <Otp email={email} digits={digits} loading={loading} countdown={countdown} setDigits={(next) => { attempted.current = ""; setDigits(next); }} onBack={() => go("form")} onVerify={verify} onResend={async () => { setLoading(true); try { await apiFetch("/auth/resend-otp", { method: "POST", body: JSON.stringify({ email }) }); setCountdown(30); setDigits(["", "", "", ""]); toast.success("A new code has been sent."); } catch (error) { toast.error(errorMessage(error, "Could not resend the code")); } finally { setLoading(false); } }} /> : null}
    </AuthLayout>
  );
}

function Choose({ onEmail, onFacebook, onGoogle, loading }: { onEmail: () => void; onFacebook: () => void; onGoogle: (token: string) => void; loading: boolean }) {
  return <AuthCard><AuthHeading title="Create your account">{intro}</AuthHeading><div className="flex flex-col gap-3"><GoogleSignInButton disabled={loading} onCredential={onGoogle} /><SocialButton type="button" disabled={loading} icon={<img src={facebookIcon} alt="" className="h-5 w-5" />} onClick={onFacebook}>Continue with Facebook</SocialButton><AuthDivider>or</AuthDivider><SocialButton variant="solid" onClick={onEmail}>Continue with email</SocialButton></div><Terms /></AuthCard>;
}

function Form({ values, loading, terms, update, setTerms, onBack, onSubmit }: { values: Values; loading: boolean; terms: boolean; update: (key: keyof Values, value: string) => void; setTerms: (value: boolean) => void; onBack: () => void; onSubmit: (event: FormEvent) => void }) {
  return <AuthCard><div className="flex flex-col gap-6"><BackLink onClick={onBack}>Back</BackLink><AuthHeading title="Create your account">{intro}</AuthHeading></div><form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate><div className="grid grid-cols-2 gap-3"><AuthField label="First name" autoComplete="given-name" placeholder="Tunde" value={values.firstName} disabled={loading} onChange={(event) => update("firstName", event.target.value)} /><AuthField label="Last name" autoComplete="family-name" placeholder="Adebayo" value={values.lastName} disabled={loading} onChange={(event) => update("lastName", event.target.value)} /></div><AuthField label="Email" type="email" autoComplete="email" placeholder="you@email.com" value={values.email} disabled={loading} onChange={(event) => update("email", event.target.value)} /><AuthField label="Phone number" type="tel" autoComplete="tel" value={values.phone} disabled={loading} onChange={(event) => update("phone", event.target.value)} /><AuthField label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={values.password} disabled={loading} onChange={(event) => update("password", event.target.value)} /><label className="flex items-center gap-2 text-[13px] text-muted-ink"><input type="checkbox" checked={terms} disabled={loading} onChange={(event) => setTerms(event.target.checked)} className="h-4 w-4 accent-ink" />I agree to the Terms and Privacy Policy.</label><SocialButton variant="solid" type="submit" disabled={loading} className="mt-2">{loading ? "Creating your account…" : "Create account"}</SocialButton></form><Terms /></AuthCard>;
}

function Otp({ email, digits, loading, countdown, setDigits, onBack, onVerify, onResend }: { email: string; digits: string[]; loading: boolean; countdown: number; setDigits: (digits: string[]) => void; onBack: () => void; onVerify: (event: FormEvent) => void; onResend: () => void }) {
  return <AuthCard><div className="flex flex-col gap-6"><BackLink onClick={onBack}>Back</BackLink><AuthHeading title="Check your email">We sent a 4-digit code to <span className="font-semibold text-ink">{email}</span>. Enter it below to confirm your address.</AuthHeading></div><form onSubmit={onVerify} className="flex flex-col gap-4"><OtpInputs value={digits} onChange={setDigits} disabled={loading} /><SocialButton variant="solid" type="submit" disabled={loading}>{loading ? "Verifying…" : "Verify email"}</SocialButton><p className="text-[13px] text-muted-ink">Didn't receive it? <button type="button" disabled={loading || countdown > 0} className="font-medium text-ink underline disabled:no-underline disabled:opacity-50" onClick={onResend}>{countdown ? `Resend in ${countdown}s` : "Resend code"}</button></p></form></AuthCard>;
}

function Terms() {
  return <p className="text-[13px] leading-[1.6] text-muted-ink">By continuing, you agree to AzarFaith&rsquo;s <Link to="/$page" params={{ page: "terms" }} className="underline">terms</Link>, <Link to="/$page" params={{ page: "privacy" }} className="underline">privacy policy</Link> and <Link to="/$page" params={{ page: "cookies" }} className="underline">cookie policy</Link>.</p>;
}
