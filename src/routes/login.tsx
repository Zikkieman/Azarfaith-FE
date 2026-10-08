import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthCard, AuthDivider, AuthHeading } from "@/components/auth/AuthCard";
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
        <AuthHeading title="Welcome back">
          Sign in to give, manage your regular gifts and follow the causes you care about.
        </AuthHeading>

        <div className="flex flex-col gap-3">
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

        <AuthDivider>or sign in with email</AuthDivider>

        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <AuthField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            {...register("email")}
            error={errors.email?.message}
          />
          <div className="flex flex-col gap-2">
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
              className="self-end text-[13px] font-medium text-ink-soft underline decoration-1 underline-offset-4 hover:text-ink"
            >
              Forgot your password?
            </Link>
          </div>
          <SocialButton variant="solid" type="submit" disabled={loading} className="mt-2">
            {loading ? "Signing in…" : "Sign in"}
          </SocialButton>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
