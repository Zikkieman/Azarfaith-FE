import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthField } from "@/components/auth/AuthField";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { OtpInputs } from "@/components/auth/OtpInputs";
import { SocialButton } from "@/components/auth/SocialButton";
import { TestimonialPanel } from "@/components/auth/TestimonialPanel";
import { useApp } from "@/lib/store";
import { ChevronLeft } from "lucide-react";
import googleIcon from "@/assets/signup/google-icon.svg";
import facebookIcon from "@/assets/signup/facebook-icon.svg";
import backgroundIllustration from "@/assets/signup/background.svg";

export const Route = createFileRoute("/signup")({ component: Signup });

const signUpSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
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
    nav({ to: "/" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <img
        src={backgroundIllustration}
        alt=""
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-70"
      />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Link to="/">
          <AuthLogo />
        </Link>
        <p className="text-[16px] leading-[35px] text-[#232323]">
          Already have an account?{" "}
          <Link to="/login" className="font-bold underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col items-center gap-[45px] px-5 pb-16 pt-6 sm:px-8 lg:flex-row lg:items-start lg:justify-center">
        {step === "choose" && <ChooseStep onEmail={() => setStep("form")} onOAuth={authenticate} />}
        {step === "form" && (
          <FormStep
            onSubmit={(data) => {
              setEmail(data.email);
              setStep("otp");
            }}
          />
        )}
        {step === "otp" && (
          <OtpStep email={email} onBack={() => setStep("form")} onVerified={authenticate} />
        )}
        <TestimonialPanel />
      </main>
    </div>
  );
}

function ChooseStep({ onEmail, onOAuth }: { onEmail: () => void; onOAuth: () => void }) {
  return (
    <AuthCard>
      <HeadingBlock />

      <div className="flex w-full flex-col items-start gap-[11px]">
        <div className="flex w-full flex-col items-center justify-center gap-[9px]">
          <SocialButton
            icon={<img src={googleIcon} alt="" className="h-5 w-5" />}
            onClick={onOAuth}
          >
            Continue with Google
          </SocialButton>
          <SocialButton
            icon={<img src={facebookIcon} alt="" className="h-5 w-5" />}
            onClick={onOAuth}
          >
            Continue with Facebook
          </SocialButton>
        </div>
        <SocialButton variant="solid" onClick={onEmail}>
          Continue with Email
        </SocialButton>
      </div>

      <AuthFootnotes />
    </AuthCard>
  );
}

function FormStep({ onSubmit }: { onSubmit: (data: SignUpForm) => void }) {
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
      <HeadingBlock />

      <form onSubmit={submit} className="flex w-full flex-col items-start gap-[11px]">
        <div className="grid w-full grid-cols-2 gap-[11px]">
          <AuthField
            label="First Name"
            placeholder="Tunde"
            {...register("firstName")}
            error={errors.firstName?.message}
          />
          <AuthField
            label="Last Name"
            placeholder="Adebayo"
            {...register("lastName")}
            error={errors.lastName?.message}
          />
        </div>
        <AuthField
          label="Email"
          type="email"
          placeholder="you@email.com"
          {...register("email")}
          error={errors.email?.message}
        />
        <AuthField
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          {...register("password")}
          error={errors.password?.message}
        />

        <SocialButton variant="solid" type="submit" disabled={loading} className="mt-[21px]">
          {loading ? "Signing up…" : "Sign Up"}
        </SocialButton>
      </form>

      <AuthFootnotes />
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
      <div className="flex w-full flex-col items-start gap-[11px] text-[#232323]">
        <button type="button" onClick={onBack} aria-label="Back">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <p className="font-display w-full text-[58px] font-normal leading-[53px] tracking-[-1.23px]">
          Verify your email
        </p>
        <p className="w-full text-[14px] leading-[26.25px]">
          We sent a 4-digits code to <span className="font-bold">{email},</span> please enter the
          code below to confirm your email address or{" "}
          <button type="button" onClick={onBack} className="text-[#fe5102] underline">
            edit email
          </button>
        </p>
      </div>

      <OtpInputs value={digits} onChange={setDigits} />
    </AuthCard>
  );
}

function HeadingBlock() {
  return (
    <div className="flex w-full flex-col items-start gap-[11px] text-[#232323]">
      <p className="w-full text-[14px] font-medium leading-[26.25px]">More than $54M 💰 Raised</p>
      <p className="font-display w-full text-[58px] font-normal leading-[53px] tracking-[-1.23px]">
        Create an account
      </p>
      <p className="w-full text-[14px] font-normal leading-[26.25px]">
        Create your free account and support churches, missionaries, and faith-based organizations
        across Nigeria.
      </p>
    </div>
  );
}

function AuthFootnotes() {
  return (
    <div className="flex w-full flex-col items-start gap-[11px] text-[#232323]">
      <p className="w-full text-[12px] leading-[26.25px]">
        Forgot your <FootLink>email</FootLink> or <FootLink>password</FootLink>?
      </p>
      <p className="w-full text-[12px] leading-[20px]">
        By continuing, I agree to Azarfaith&rsquo;s <FootLink>terms</FootLink>,{" "}
        <FootLink>privacy policy</FootLink>, and <FootLink>cookie policy</FootLink>
        <span className="text-[#fe5102]">.</span>
      </p>
    </div>
  );
}

function FootLink({ children }: { children: React.ReactNode }) {
  return <span className="text-[#fe5102] underline underline-offset-2">{children}</span>;
}
