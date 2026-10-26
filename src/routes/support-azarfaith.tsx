import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, HeartHandshake, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import logoMark from "@/assets/signup/logo-mark.svg";
import { SiteNav } from "@/components/landing/SiteNav";
import { Footer } from "@/components/landing/Footer";
import { btn } from "@/components/app/btn";
import { inputClass, labelClass } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { formatMoney } from "@/lib/domain";
import { formatAmountInput, parseAmountInput } from "@/lib/giving";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/support-azarfaith")({
  validateSearch: (search: Record<string, unknown>): { reference?: string } => ({
    reference:
      typeof search.reference === "string" && search.reference ? search.reference : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Support AzarFaith — Make a direct donation" },
      {
        name: "description",
        content:
          "Give directly to AzarFaith to help keep the platform running and respond to urgent causes.",
      },
    ],
  }),
  component: SupportAzarFaith,
});

type CheckoutContext = {
  currency: "NGN";
  givingPaused: boolean;
  minDonation: number;
  maxDonation: number;
  platformFee: number;
};
type Verification = {
  status: "success" | "pending";
  reference?: string;
  amount?: number;
  donorName?: string;
  paidAt?: string;
  message: string;
};
const amounts = [5000, 10000, 25000, 50000];

function SupportAzarFaith() {
  const { reference } = Route.useSearch();
  const { user } = useAuth();
  const context = useQuery({
    queryKey: ["support-checkout"],
    queryFn: () => apiFetch<CheckoutContext>("/payments/support/checkout", { cache: "no-store" }),
    retry: false,
    enabled: !reference,
  });
  const verification = useQuery({
    queryKey: ["support-verification", reference],
    queryFn: () =>
      apiFetch<Verification>("/payments/support/donations/verify", {
        method: "POST",
        body: JSON.stringify({ reference }),
      }),
    enabled: Boolean(reference),
    retry: false,
  });
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);
  useEffect(() => {
    if (!user) return;
    setName((current) => current || user.fullName);
    setEmail((current) => current || user.email);
  }, [user]);

  const gift = custom ? parseAmountInput(custom) : (amount ?? 0);
  const min = context.data?.minDonation ?? 100;
  const max = context.data?.maxDonation ?? 5000000;
  const invalidAmount = !Number.isSafeInteger(gift) || gift < min || gift > max;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (invalidAmount || context.data?.givingPaused || processing) return;
    setProcessing(true);
    try {
      const result = await apiFetch<{ authorizationUrl: string }>("/payments/support/donations", {
        method: "POST",
        body: JSON.stringify({
          amount: gift,
          donorName: name.trim(),
          donorEmail: email.trim(),
          note: note.trim() || undefined,
        }),
      });
      window.location.assign(result.authorizationUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start your donation.");
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper font-gsf text-heading">
      <SiteNav />
      <main>
        <section className="mx-auto grid w-full max-w-[1280px] gap-10 px-6 py-14 md:px-12 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)] lg:items-start lg:gap-16">
          <div className="flex flex-col items-start gap-7 lg:pt-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-peach px-4 py-2 text-[13px] font-semibold text-ink">
              <img src={logoMark} alt="" className="h-5 w-5" /> Direct support for AzarFaith
            </span>
            <h1 className="max-w-[700px] font-display text-[clamp(42px,5.3vw,76px)] leading-[1.04] tracking-[-0.035em] text-ink">
              Help us keep good work moving.
            </h1>
            <p className="max-w-[620px] text-[17px] leading-[1.65] text-ink-soft">
              Your donation to AzarFaith helps us keep the platform running, check organizations
              carefully, and respond to urgent causes. We direct this support where it is needed
              most.
            </p>
            <div className="grid w-full gap-3 sm:grid-cols-2">
              <div className="rounded-card border border-line-soft bg-panel p-5">
                <HeartHandshake className="h-6 w-6 text-brand" strokeWidth={1.75} />
                <h2 className="mt-4 font-display text-[21px] text-ink">Urgent causes</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Help us respond when verified communities face an immediate need.
                </p>
              </div>
              <div className="rounded-card border border-line-soft bg-panel p-5">
                <ShieldCheck className="h-6 w-6 text-brand" strokeWidth={1.75} />
                <h2 className="mt-4 font-display text-[21px] text-ink">A strong platform</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Support verification and the work required to keep giving reliable.
                </p>
              </div>
            </div>
            <p className="max-w-[610px] text-[13px] leading-relaxed text-muted-ink">
              This gift goes to AzarFaith. It is separate from donations to individual campaigns and
              is not added to a campaign’s total.
            </p>
          </div>

          {reference ? (
            <div
              className="rounded-card border border-line-soft bg-paper p-6 shadow-[0_24px_64px_-24px_rgba(19,14,48,0.18)] sm:p-8"
              aria-live="polite"
            >
              {verification.isLoading ? (
                <p className="text-sm text-ink-soft">Checking your payment with Paystack…</p>
              ) : null}
              {verification.data?.status === "success" ? (
                <div className="flex flex-col items-start gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-verified text-white">
                    <Check className="h-6 w-6" />
                  </span>
                  <h2 className="font-display text-[28px] text-ink">
                    Thank you, {verification.data.donorName}
                  </h2>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    Your donation to AzarFaith was confirmed. A receipt will be sent to your email.
                  </p>
                  <dl className="w-full divide-y divide-line-soft border-y border-line-soft text-sm">
                    <div className="flex justify-between gap-4 py-3">
                      <dt className="text-muted-ink">Donation</dt>
                      <dd className="font-semibold text-ink">
                        {formatMoney(verification.data.amount ?? 0)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 py-3">
                      <dt className="text-muted-ink">Reference</dt>
                      <dd className="max-w-[220px] break-all text-right font-medium text-ink">
                        {verification.data.reference}
                      </dd>
                    </div>
                  </dl>
                  <Link to="/" className={btn("secondary")}>
                    Back to AzarFaith
                  </Link>
                </div>
              ) : null}
              {verification.data?.status === "pending" || verification.error ? (
                <div className="flex flex-col items-start gap-4">
                  <h2 className="font-display text-[27px] text-ink">Payment not confirmed yet</h2>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    {verification.error instanceof Error
                      ? verification.error.message
                      : verification.data?.message}
                  </p>
                  <p className="text-sm text-ink-soft">
                    Please check this payment before trying again so you do not make a duplicate
                    donation.
                  </p>
                  <button
                    type="button"
                    disabled={verification.isFetching}
                    onClick={() => {
                      void verification.refetch();
                    }}
                    className={btn("primary")}
                  >
                    {verification.isFetching ? "Checking…" : "Check payment again"}
                  </button>
                  <Link to="/" className="text-sm font-medium text-ink underline">
                    Back to AzarFaith
                  </Link>
                </div>
              ) : null}
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                void submit(event);
              }}
              className="flex flex-col gap-6 rounded-card border border-line-soft bg-paper p-6 shadow-[0_24px_64px_-24px_rgba(19,14,48,0.18)] sm:p-8"
            >
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brand-ink">
                  One-time donation
                </p>
                <h2 className="mt-2 font-display text-[29px] leading-tight text-ink">
                  Support AzarFaith directly
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Choose an amount. No AzarFaith platform fee is added.
                </p>
              </div>
              {context.error ? (
                <p role="alert" className="rounded-field bg-danger/5 p-3 text-sm text-danger">
                  Could not load donation settings.{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => {
                      void context.refetch();
                    }}
                  >
                    Try again
                  </button>
                </p>
              ) : null}
              {context.data?.givingPaused ? (
                <p role="alert" className="rounded-field bg-panel p-3 text-sm text-ink-soft">
                  Giving is temporarily paused. Please check back later.
                </p>
              ) : null}
              <div className="flex flex-col gap-3">
                <span className={labelClass}>Amount</span>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Donation amount">
                  {amounts.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      aria-pressed={amount === preset}
                      onClick={() => {
                        setAmount(preset);
                        setCustom(formatAmountInput(String(preset)));
                      }}
                      className={cn(
                        "rounded-field border px-4 py-3 text-left font-display text-[19px] transition-colors",
                        amount === preset
                          ? "border-ink bg-ink text-ink-contrast"
                          : "border-line-input text-ink hover:border-ink",
                      )}
                    >
                      {formatMoney(preset)}
                    </button>
                  ))}
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Custom amount</span>
                  <span className="relative block">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-ink">
                      ₦
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={custom}
                      onChange={(event) => {
                        setCustom(formatAmountInput(event.target.value));
                        setAmount(null);
                      }}
                      placeholder="Enter an amount"
                      className={cn(inputClass, "pl-8")}
                    />
                  </span>
                </label>
                {gift > 0 && invalidAmount ? (
                  <p className="text-[13px] text-danger">
                    Choose between {formatMoney(min)} and {formatMoney(max)}.
                  </p>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Your name</span>
                  <input
                    required
                    maxLength={120}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Email for your receipt</span>
                  <input
                    required
                    type="email"
                    maxLength={160}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    className={inputClass}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>
                  Message <span className="font-normal text-muted-ink">(optional)</span>
                </span>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className={cn(inputClass, "resize-none")}
                />
              </label>
              <div className="flex items-center justify-between gap-4 border-t border-line-soft pt-5">
                <span className="text-sm text-muted-ink">Total today</span>
                <span className="font-display text-[26px] text-ink">
                  {gift ? formatMoney(gift) : "—"}
                </span>
              </div>
              <button
                type="submit"
                disabled={
                  processing ||
                  context.isLoading ||
                  context.isFetching ||
                  context.data?.givingPaused ||
                  invalidAmount ||
                  Boolean(context.error)
                }
                className={cn(btn("primary", "lg"), "w-full")}
              >
                {processing
                  ? "Opening Paystack…"
                  : `Donate ${gift ? formatMoney(gift) : "to AzarFaith"}`}{" "}
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="flex items-center justify-center gap-1.5 text-center text-[12px] text-muted-ink">
                <Lock className="h-3.5 w-3.5" /> Secure one-time payment through Paystack.{" "}
                <Mail className="h-3.5 w-3.5" /> Email receipt after confirmation.
              </p>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
