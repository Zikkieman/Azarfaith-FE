import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { AuthCard, AuthDivider, AuthHeading } from "@/components/auth/AuthCard";
import { AuthField } from "@/components/auth/AuthField";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { SocialButton } from "@/components/auth/SocialButton";
import facebookIcon from "@/assets/signup/facebook-icon.svg";
import { apiFetch, API_BASE_URL } from "@/lib/api";
import { useAuth, type AuthUser } from "@/lib/auth";
import { safeRedirect } from "@/lib/session";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } =>
    typeof s.redirect === "string" ? { redirect: s.redirect } : {},
  head: () => ({ meta: [{ title: "Sign in — AzarFaith" }] }),
  component: Login,
});

const schema = z.object({
  identifier: z.string().min(1, "Enter your email or phone number"),
  password: z.string().min(1, "Enter your password"),
});
type LoginForm = z.infer<typeof schema>;

const message = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

function Login() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const form = useForm<LoginForm>({ resolver: zodResolver(schema) });
  const destination = safeRedirect(redirect);

  useEffect(() => {
    if (user) void navigate({ href: destination, replace: true });
  }, [destination, navigate, user]);

  const complete = (next: AuthUser) => {
    setUser(next);
    void navigate({ href: destination, replace: true });
  };

  const google = async (idToken: string) => {
    setLoading(true);
    try {
      const result = await apiFetch<{ user: AuthUser }>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });
      complete(result.user);
    } catch (error) {
      toast.error(message(error, "Google sign-in failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout prompt="New to AzarFaith?" linkLabel="Create an account" linkTo="/signup">
      <AuthCard>
        <AuthHeading title="Welcome back">
          Sign in to give, manage your regular gifts and follow the causes you care about.
        </AuthHeading>
        <div className="flex flex-col gap-3">
          <GoogleSignInButton disabled={loading} onCredential={google} />
          <SocialButton type="button" disabled={loading} icon={<img src={facebookIcon} alt="" className="h-5 w-5" />} onClick={() => window.location.assign(`${API_BASE_URL}/auth/facebook/start`)}>
            Continue with Facebook
          </SocialButton>
        </div>
        <AuthDivider>or sign in with email</AuthDivider>
        <form
          onSubmit={form.handleSubmit(async (values) => {
            setLoading(true);
            try {
              const result = await apiFetch<{ user: AuthUser }>("/auth/login", {
                method: "POST",
                body: JSON.stringify(values),
              });
              complete(result.user);
            } catch (error) {
              toast.error(message(error, "Login failed"));
            } finally {
              setLoading(false);
            }
          })}
          className="flex flex-col gap-4"
          noValidate
        >
          <AuthField id="identifier" label="Email or phone" autoComplete="username" placeholder="you@email.com" disabled={loading} {...form.register("identifier")} error={form.formState.errors.identifier?.message} />
          <div className="flex flex-col gap-2">
            <AuthField id="password" label="Password" type="password" autoComplete="current-password" placeholder="Your password" disabled={loading} {...form.register("password")} error={form.formState.errors.password?.message} />
            <Link to="/forgot-password" className="self-end text-[13px] font-medium text-ink-soft underline decoration-1 underline-offset-4 hover:text-ink">
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
