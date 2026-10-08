import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthCard, AuthDivider, AuthHeading } from "@/components/auth/AuthCard";
import { AuthField } from "@/components/auth/AuthField";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { OtpInputs } from "@/components/auth/OtpInputs";
import { SocialButton } from "@/components/auth/SocialButton";
import { BackLink } from "@/components/app/AppShell";
import { useApp } from "@/lib/store";
import googleIcon from "@/assets/signup/google-icon.svg";
import facebookIcon from "@/assets/signup/facebook-icon.svg";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create an account — AzarFaith" }] }),
  component: Signup,
});

const signUpSchema = z.object({
  firstName: z.string().min(1, "Enter your first name"),
  lastName: z.string().min(1, "Enter your last name"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});
type SignUpForm = z.infer<typeof signUpSchema>;

type Step = "choose" | "form" | "otp";

function Signup() {
  const nav = useNavigate();
  const setAuthed = useApp((s) => s.setAuthed);
  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState("");

  const authenticate = () => {
    setAuthed(true);
    nav({ to: "/dashboard" });
  };

  return (
    <AuthLayout prompt="Already have an account?" linkLabel="Sign in" linkTo="/login">
      {step === "choose" ? (
        <ChooseStep onEmail={() => setStep("form")} onOAuth={authenticate} />
      ) : null}
      {step === "form" ? (
        <FormStep
          onBack={() => setStep("choose")}
          onSubmit={(data) => {
            setEmail(data.email);
            setStep("otp");
          }}
        />
      ) : null}
      {step === "otp" ? (
        <OtpStep email={email} onBack={() => setStep("form")} onVerified={authenticate} />
      ) : null}
    </AuthLayout>
  );
}

const intro =
  "Give to verified churches, missions and orphanages across Nigeria, and see what every gift did.";

function ChooseStep({ onEmail, onOAuth }: { onEmail: () => void; onOAuth: () => void }) {
  return (
    <AuthCard>
      <AuthHeading title="Create your account">{intro}</AuthHeading>

      <div className="flex flex-col gap-3">
        <SocialButton icon={<img src={googleIcon} alt="" className="h-5 w-5" />} onClick={onOAuth}>
          Continue with Google
        </SocialButton>
        <SocialButton
          icon={<img src={facebookIcon} alt="" className="h-5 w-5" />}
          onClick={onOAuth}
        >
          Continue with Facebook
        </SocialButton>
        <AuthDivider>or</AuthDivider>
        <SocialButton variant="solid" onClick={onEmail}>
          Continue with email
        </SocialButton>
      </div>

      <Terms />
    </AuthCard>
  );
}

function FormStep({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (data: SignUpForm) => void;
}) {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpForm>({ resolver: zodResolver(signUpSchema) });

  const submit = handleSubmit((data) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSubmit(data);
    }, 600);
  });

  return (
    <AuthCard>
      <div className="flex flex-col gap-6">
        <BackLink onClick={onBack}>Back</BackLink>
        <AuthHeading title="Create your account">{intro}</AuthHeading>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <AuthField
            label="First name"
            autoComplete="given-name"
            placeholder="Tunde"
            {...register("firstName")}
            error={errors.firstName?.message}
          />
          <AuthField
            label="Last name"
            autoComplete="family-name"
            placeholder="Adebayo"
            {...register("lastName")}
            error={errors.lastName?.message}
          />
        </div>
        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          {...register("email")}
          error={errors.email?.message}
        />
        <AuthField
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          {...register("password")}
          error={errors.password?.message}
        />
        <SocialButton variant="solid" type="submit" disabled={loading} className="mt-2">
          {loading ? "Creating your account…" : "Create account"}
        </SocialButton>
      </form>

      <Terms />
    </AuthCard>
  );
}

function OtpStep({
  email,
  onBack,
  onVerified,
}: {
  email: string;
  onBack: () => void;
  onVerified: () => void;
}) {
  const [digits, setDigits] = useState(["", "", "", ""]);

  useEffect(() => {
    if (digits.every(Boolean)) {
      const t = setTimeout(onVerified, 400);
      return () => clearTimeout(t);
    }
  }, [digits, onVerified]);

  return (
    <AuthCard>
      <div className="flex flex-col gap-6">
        <BackLink onClick={onBack}>Back</BackLink>
        <AuthHeading title="Check your email">
          We sent a 4-digit code to <span className="font-semibold text-ink">{email}</span>. Enter
          it below to confirm your address, or{" "}
          <button
            type="button"
            onClick={onBack}
            className="font-semibold text-ink underline decoration-1 underline-offset-4"
          >
            change your email
          </button>
          .
        </AuthHeading>
      </div>

      <OtpInputs value={digits} onChange={setDigits} />
    </AuthCard>
  );
}

function Terms() {
  return (
    <p className="text-[13px] leading-[1.6] text-muted-ink">
      By continuing, you agree to AzarFaith&rsquo;s <TermsLink to="/terms">terms</TermsLink>,{" "}
      <TermsLink to="/privacy">privacy policy</TermsLink> and{" "}
      <TermsLink to="/cookies">cookie policy</TermsLink>.
    </p>
  );
}

function TermsLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to as "/"}
      className="text-ink-soft underline decoration-1 underline-offset-4 hover:text-ink"
    >
      {children}
    </Link>
  );
}
