import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MailCheck } from "lucide-react";
import { AuthCard, AuthHeading } from "@/components/auth/AuthCard";
import { btn } from "@/components/app/btn";
import { cn } from "@/lib/utils";
import { AuthField } from "@/components/auth/AuthField";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SocialButton } from "@/components/auth/SocialButton";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset your password — AzarFaith" }] }),
  component: ForgotPassword,
});

const resetSchema = z.object({ email: z.string().email("Enter a valid email address") });
type ResetForm = z.infer<typeof resetSchema>;

function ForgotPassword() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  const submit = handleSubmit(async ({ email }) => {
    setLoading(true);
    try {
      await apiFetch<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setSentTo(email.trim().toLowerCase());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the reset link.");
    } finally {
      setLoading(false);
    }
  });

  return (
    <AuthLayout prompt="Remember your password?" linkLabel="Sign in" linkTo="/login">
      <AuthCard>
        {sentTo ? (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-panel text-ink">
              <MailCheck className="h-6 w-6" strokeWidth={1.5} />
            </span>
            <AuthHeading title="Check your inbox">
              If an account exists for <span className="font-semibold text-ink">{sentTo}</span>, a
              reset link is on its way. It expires in 30 minutes.
            </AuthHeading>
            <div className="flex flex-col gap-3">
              <Link to="/login" className={cn(btn("primary", "lg"), "w-full")}>
                Back to sign in
              </Link>
              <SocialButton onClick={() => setSentTo(null)}>Use a different email</SocialButton>
            </div>
          </>
        ) : (
          <>
            <AuthHeading title="Reset your password">
              Enter your email and we&rsquo;ll send you a link to choose a password. This also works if
              you originally joined with Google or Facebook.
            </AuthHeading>
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
              <SocialButton variant="solid" type="submit" disabled={loading} className="mt-2">
                {loading ? "Sending…" : "Send reset link"}
              </SocialButton>
            </form>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
