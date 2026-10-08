import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MailCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthField } from "@/components/auth/AuthField";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SocialButton } from "@/components/auth/SocialButton";

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

  const submit = handleSubmit(({ email }) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSentTo(email);
    }, 600);
  });

  return (
    <AuthLayout prompt="Remember your password?" linkLabel="Sign in" linkTo="/login">
      <AuthCard>
        {sentTo ? (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-peach text-[#fe5102]">
              <MailCheck className="h-6 w-6" strokeWidth={1.5} />
            </span>
            <div className="flex w-full flex-col items-start gap-[11px] text-heading">
              <h1 className="w-full font-display text-[clamp(36px,4.4vw,52px)] font-medium leading-[0.98] tracking-[-0.03em]">
                Check your inbox
              </h1>
              <p className="w-full text-[14px] leading-[26.25px]">
                If an account exists for <span className="font-bold">{sentTo}</span>, a reset link
                is on its way. It expires in 30 minutes.
              </p>
            </div>
            <div className="flex w-full flex-col gap-[9px]">
              <Link
                to="/login"
                className="flex w-full items-center justify-center rounded-[8px] bg-btn px-4 py-3 text-sm font-semibold leading-5 text-btn-fg hover:bg-btn/90"
              >
                Back to sign in
              </Link>
              <SocialButton onClick={() => setSentTo(null)}>Use a different email</SocialButton>
            </div>
          </>
        ) : (
          <>
            <div className="flex w-full flex-col items-start gap-[11px] text-heading">
              <p className="w-full text-[14px] font-medium leading-[26.25px]">Account help</p>
              <h1 className="w-full font-display text-[clamp(36px,4.4vw,52px)] font-medium leading-[0.98] tracking-[-0.03em]">
                Reset your password
              </h1>
              <p className="w-full text-[14px] leading-[26.25px]">
                Enter the email you signed up with and we&rsquo;ll send you a link to choose a new
                password.
              </p>
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
              <SocialButton variant="solid" type="submit" disabled={loading} className="mt-[21px]">
                {loading ? "Sending…" : "Send reset link"}
              </SocialButton>
            </form>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
