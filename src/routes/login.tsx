import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthField } from "@/components/auth/AuthField";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SocialButton } from "@/components/auth/SocialButton";
import { useApp } from "@/lib/store";
import { safeRedirect } from "@/lib/session";
import googleIcon from "@/assets/signup/google-icon.svg";
import facebookIcon from "@/assets/signup/facebook-icon.svg";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } =>
    typeof s.redirect === "string" ? { redirect: s.redirect } : {},
  head: () => ({ meta: [{ title: "Sign in — AzarFaith" }] }),
  component: Login,
});

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
type LoginForm = z.infer<typeof loginSchema>;

function Login() {
  const nav = useNavigate();
  const { redirect } = Route.useSearch();
  const setAuthed = useApp((s) => s.setAuthed);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const authenticate = () => {
    setAuthed(true);
    nav({ href: safeRedirect(redirect) });
  };

  const submit = handleSubmit(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      authenticate();
    }, 600);
  });

  return (
    <AuthLayout prompt="New to AzarFaith?" linkLabel="Create an account" linkTo="/signup">
      <AuthCard>
        <div className="flex w-full flex-col items-start gap-[11px] text-heading">
          <p className="w-full text-[14px] font-medium leading-[26.25px]">Welcome back</p>
          <h1 className="w-full font-display text-[clamp(40px,5vw,58px)] font-normal leading-[0.92] tracking-[-1.23px]">
            Sign in
          </h1>
          <p className="w-full text-[14px] leading-[26.25px]">
            Give, manage your recurring support, and follow the causes you care about.
          </p>
        </div>

        <div className="flex w-full flex-col gap-[9px]">
          <SocialButton
            icon={<img src={googleIcon} alt="" className="h-5 w-5" />}
            onClick={authenticate}
          >
            Continue with Google
          </SocialButton>
          <SocialButton
            icon={<img src={facebookIcon} alt="" className="h-5 w-5" />}
            onClick={authenticate}
          >
            Continue with Facebook
          </SocialButton>
        </div>

        <div className="flex w-full items-center gap-3">
          <span className="h-px flex-1 bg-[#ebebeb]" />
          <span className="text-xs text-muted-ink">or sign in with email</span>
          <span className="h-px flex-1 bg-[#ebebeb]" />
        </div>

        <form onSubmit={submit} className="flex w-full flex-col items-start gap-[11px]">
          <AuthField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            {...register("email")}
            error={errors.email?.message}
          />
          <AuthField
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            {...register("password")}
            error={errors.password?.message}
          />
          <Link
            to="/forgot-password"
            className="self-end text-[12px] text-[#fe5102] underline underline-offset-2"
          >
            Forgot your password?
          </Link>
          <SocialButton variant="solid" type="submit" disabled={loading} className="mt-[10px]">
            {loading ? "Signing in…" : "Sign in"}
          </SocialButton>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
