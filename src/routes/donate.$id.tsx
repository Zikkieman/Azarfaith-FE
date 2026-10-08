import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BellRing,
  Building2,
  Check,
  ChevronLeft,
  CreditCard,
  Info,
  Lock,
  Repeat2,
  ShieldCheck,
} from "lucide-react";
import {
  AppShell,
  ChoiceCard,
  Container,
  Notice,
  Pill,
  ProgressBar,
  Stepper,
  btnPrimary,
  btnSecondary,
  cardClass,
  eyebrowClass,
  inputClass,
  labelClass,
} from "@/components/app/AppShell";
import { useApp } from "@/lib/store";
import { formatMoney } from "@/lib/mock";
import { toast } from "sonner";
import { notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/donate/$id")({
  head: () => ({ meta: [{ title: "Give — AzarFaith" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    freq: (s.freq as string) ?? "",
  }),
  component: AzarFaithDonate,
});

const presets = [2000, 5000, 10000, 25000, 50000, 100000];

const frequencyLabel: Record<string, string> = {
  weekly: "Every week",
  monthly: "Every month",
  quarterly: "Every quarter",
  once: "One time",
};

function AzarFaithDonate() {
  const { id } = Route.useParams();
  const { freq } = Route.useSearch();
  const nav = useNavigate();
  const { campaigns, donate, addRecurringDonation } = useApp();

  const campaign = campaigns.find((c) => c.id === id);
  if (!campaign) throw notFound();

  const isRecurring = freq && freq !== "once";

  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"card" | "bank">("card");
  const [recurringMode, setRecurringMode] = useState<"auto" | "pledge">("auto");
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [note, setNote] = useState("");
  const [tip, setTip] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const finalAmount = customAmount ? parseInt(customAmount) || 0 : amount;
  const platformFee = Math.round(finalAmount * 0.025);
  const total = finalAmount + platformFee + tip;
  const steps = isRecurring
    ? ["Amount", "How to give", "Payment", "Review"]
    : ["Amount", "Payment", "Review"];

  const next = () => {
    if (step === 0 && finalAmount < 100) {
      toast.error("Minimum donation is ₦100");
      return;
    }
    setStep((s) => s + 1);
  };

  const submit = () => {
    setProcessing(true);
    setTimeout(() => {
      donate(campaign.id, finalAmount, anonymous ? "Anonymous" : name || "You", note || undefined);
      if (isRecurring) {
        addRecurringDonation({
          id: Math.random().toString(36).slice(2),
          donorId: "me",
          targetId: campaign.id,
          targetName: campaign.title,
          targetCover: campaign.cover,
          amount: finalAmount,
          frequency: freq as "weekly" | "monthly" | "quarterly",
          mode: recurringMode,
          nextDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          active: true,
        });
      }
      setProcessing(false);
      setDone(true);
    }, 1400);
  };

  const summaryRows = [
    { label: "Your gift", value: formatMoney(finalAmount) },
    { label: "Platform fee (2.5%)", value: formatMoney(platformFee) },
    ...(tip > 0 ? [{ label: "Tip to AzarFaith", value: formatMoney(tip) }] : []),
  ];
  const pct = campaign.goal
    ? Math.min(100, Math.round((campaign.raised / campaign.goal) * 100))
    : 0;

  if (done) {
    return (
      <AppShell>
        <Container className="flex flex-col items-center py-20 text-center md:py-28">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-[#FE5102] text-white animate-pop">
            <Check className="h-10 w-10" strokeWidth={2} />
          </span>
          <p className={`${eyebrowClass} mt-8`}>Gift received</p>
          <h1 className="mt-3 font-display text-[clamp(36px,4.4vw,64px)] leading-[1.08] tracking-[-0.01em] text-[#130E30]">
            Thank you{!anonymous && name ? `, ${name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-4 max-w-[560px] text-lg leading-[27.9px] tracking-[-0.02em] text-[#4A4660]">
            {isRecurring
              ? `Your ${freq} gift of ${formatMoney(finalAmount)} to ${campaign.title} is set up.`
              : `Your gift of ${formatMoney(finalAmount)} to ${campaign.title} has been received. A receipt is on its way to your inbox.`}
          </p>
          {isRecurring ? (
            <div className="mt-6 max-w-[560px]">
              <Notice>
                <Repeat2 className="mr-1.5 inline h-4 w-4" strokeWidth={1.5} />
                {recurringMode === "auto"
                  ? "Paystack will charge you automatically. You can cancel any time from My giving."
                  : "We'll remind you each time your gift is due. You can cancel any time from My giving."}
              </Notice>
            </div>
          ) : null}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/campaign/$id" params={{ id: campaign.id }} className={btnPrimary}>
              Back to campaign
            </Link>
            <Link to={isRecurring ? "/my-giving" : "/discover"} className={btnSecondary}>
              {isRecurring ? "Manage my giving" : "Discover more causes"}
            </Link>
          </div>
        </Container>
      </AppShell>
    );
  }

  const cta = (className: string) =>
    step < steps.length - 1 ? (
      <button type="button" onClick={next} className={`${btnPrimary} ${className}`}>
        Continue
      </button>
    ) : (
      <button
        type="button"
        onClick={submit}
        disabled={processing}
        className={`${btnPrimary} ${className}`}
      >
        <Lock className="h-4 w-4" strokeWidth={1.5} />
        {processing ? "Processing…" : "Confirm gift"}
      </button>
    );

  const stepTitle = (title: string, sub?: string) => (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-[clamp(28px,2.78vw,40px)] leading-[1.14] tracking-[-0.01em] text-[#130E30]">
        {title}
      </h1>
      {sub ? <p className="text-base leading-[25.6px] text-[#4A4660]">{sub}</p> : null}
    </div>
  );

  return (
    <AppShell
      bottomBar={
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-[#667085]">
              Total{isRecurring ? ` · ${frequencyLabel[freq].toLowerCase()}` : ""}
            </p>
            <p className="font-display text-xl text-[#130E30]">{formatMoney(total)}</p>
          </div>
          {cta("shrink-0 px-6")}
        </div>
      }
    >
      <Container className="py-10 md:py-14">
        <button
          type="button"
          onClick={() =>
            step > 0 ? setStep((s) => s - 1) : nav({ to: "/campaign/$id", params: { id } })
          }
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#4A4660] transition-colors hover:text-[#130E30]"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          {step > 0 ? "Back" : "Back to campaign"}
        </button>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-10">
            <div className="flex items-center gap-3 rounded-xl border border-[rgba(57,62,70,0.08)] p-3 lg:hidden">
              <img
                src={campaign.cover}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg object-cover"
              />
              <p className="line-clamp-2 min-w-0 text-sm font-semibold leading-5 text-[#0B0E0D]">
                {campaign.title}
              </p>
            </div>
            <Stepper steps={steps} current={step} />

            {step === 0 ? (
              <div className="flex flex-col gap-6">
                {stepTitle(
                  isRecurring
                    ? `How much ${frequencyLabel[freq].toLowerCase()}?`
                    : "How much would you like to give?",
                  "Every naira goes to a verified organization.",
                )}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {presets.map((p) => {
                    const selected = amount === p && !customAmount;
                    return (
                      <button
                        key={p}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setAmount(p);
                          setCustomAmount("");
                        }}
                        className={`rounded-xl border py-3.5 font-display text-base transition-colors sm:py-4 sm:text-xl ${
                          selected
                            ? "border-[#130E30] bg-[#130E30] text-[#EFF2E5]"
                            : "border-[rgba(57,62,70,0.12)] text-[#130E30] hover:border-[#130E30]/40"
                        }`}
                      >
                        {formatMoney(p)}
                      </button>
                    );
                  })}
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Or enter your own amount</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-[#4A4660]">
                      ₦
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={100}
                      className={`${inputClass} pl-8`}
                      placeholder="Minimum ₦100"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setAmount(0);
                      }}
                    />
                  </div>
                </label>
                {finalAmount > 0 ? (
                  <Notice>
                    <Info className="mr-1.5 inline h-4 w-4" strokeWidth={1.5} />A 2.5% platform fee
                    ({formatMoney(platformFee)}) keeps AzarFaith running and pays for verification.
                  </Notice>
                ) : null}
              </div>
            ) : null}

            {isRecurring && step === 1 ? (
              <div className="flex flex-col gap-6">
                {stepTitle(
                  "How would you like to give?",
                  "Choose automatic charging or a reminder each time.",
                )}
                <div className="flex flex-col gap-3">
                  <ChoiceCard
                    selected={recurringMode === "auto"}
                    onClick={() => setRecurringMode("auto")}
                    icon={<Repeat2 className="h-5 w-5" strokeWidth={1.5} />}
                    title="Automatic (recommended)"
                    description="Paystack charges your card on schedule. Set it and forget it."
                  />
                  <ChoiceCard
                    selected={recurringMode === "pledge"}
                    onClick={() => setRecurringMode("pledge")}
                    icon={<BellRing className="h-5 w-5" strokeWidth={1.5} />}
                    title="Reminder / pledge"
                    description="We remind you when each gift is due. You confirm and pay."
                  />
                </div>
              </div>
            ) : null}

            {step === (isRecurring ? 2 : 1) ? (
              <div className="flex flex-col gap-8">
                {stepTitle("Payment details")}
                <div className="flex flex-col gap-3">
                  <ChoiceCard
                    selected={payMethod === "card"}
                    onClick={() => setPayMethod("card")}
                    icon={<CreditCard className="h-5 w-5" strokeWidth={1.5} />}
                    title="Debit or credit card"
                    description="Visa, Mastercard, Verve"
                  />
                  <ChoiceCard
                    selected={payMethod === "bank"}
                    onClick={() => setPayMethod("bank")}
                    icon={<Building2 className="h-5 w-5" strokeWidth={1.5} />}
                    title="Bank transfer"
                    description="Instant transfer via Paystack"
                  />
                </div>

                <div className="flex flex-col gap-4">
                  <label className="flex items-center gap-3 text-base text-[#130E30]">
                    <input
                      type="checkbox"
                      checked={anonymous}
                      onChange={(e) => setAnonymous(e.target.checked)}
                      className="h-4 w-4 accent-[#130E30]"
                    />
                    Give anonymously
                  </label>
                  {!anonymous ? (
                    <label className="flex flex-col gap-1.5">
                      <span className={labelClass}>Your name (optional)</span>
                      <input
                        className={inputClass}
                        placeholder="Shown on the campaign page"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </label>
                  ) : null}
                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>Message of encouragement (optional)</span>
                    <textarea
                      rows={3}
                      className={`${inputClass} resize-none`}
                      placeholder="Praying for you and the team"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-3">
                  <p className={labelClass}>Add a tip to AzarFaith?</p>
                  <div className="flex flex-wrap gap-2">
                    {[0, 500, 1000, 2500].map((t) => (
                      <Pill key={t} active={tip === t} onClick={() => setTip(t)}>
                        {t === 0 ? "No tip" : formatMoney(t)}
                      </Pill>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {step === (isRecurring ? 3 : 2) ? (
              <div className="flex flex-col gap-6">
                {stepTitle("Review your gift", "Check the details, then confirm.")}
                <dl className={`${cardClass} flex flex-col gap-2.5 p-5 lg:hidden`}>
                  {summaryRows.map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <dt className="text-[#667085]">{label}</dt>
                      <dd className="text-[#130E30]">{value}</dd>
                    </div>
                  ))}
                </dl>
                <dl className={`${cardClass} divide-y divide-[#EBECEC]`}>
                  {[
                    { label: "To", value: campaign.title },
                    { label: "From", value: anonymous ? "Anonymous" : name || "You" },
                    { label: "Payment", value: payMethod === "card" ? "Card" : "Bank transfer" },
                    ...(isRecurring
                      ? [
                          { label: "Frequency", value: frequencyLabel[freq] },
                          {
                            label: "Mode",
                            value: recurringMode === "auto" ? "Automatic" : "Reminder",
                          },
                        ]
                      : []),
                    ...(note ? [{ label: "Message", value: note }] : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between gap-6 px-5 py-4">
                      <dt className="shrink-0 text-sm text-[#667085]">{label}</dt>
                      <dd className="min-w-0 text-right text-base text-[#130E30]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            <div className="hidden lg:flex">{cta("min-w-[240px]")}</div>
          </div>

          <aside className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
            <div className={`${cardClass} flex flex-col gap-5 p-6`}>
              <div className="flex items-center gap-4">
                <img
                  src={campaign.cover}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#4A4660]">
                    {campaign.faithCategory}
                  </p>
                  <p className="line-clamp-2 text-base font-semibold leading-[22px] text-[#0B0E0D]">
                    {campaign.title}
                  </p>
                </div>
              </div>
              {campaign.goal ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm text-[#667085]">
                    <span>{formatMoney(campaign.raised)} raised</span>
                    <span>{pct}%</span>
                  </div>
                  <ProgressBar pct={pct} />
                </div>
              ) : null}
              <dl className="flex flex-col gap-2.5 border-t border-[#EBECEC] pt-5">
                {summaryRows.map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <dt className="text-[#667085]">{label}</dt>
                    <dd className="text-[#130E30]">{value}</dd>
                  </div>
                ))}
                <div className="mt-2 flex items-end justify-between border-t border-[#EBECEC] pt-4">
                  <dt className="text-base font-semibold text-[#130E30]">
                    Total{isRecurring ? ` · ${frequencyLabel[freq].toLowerCase()}` : ""}
                  </dt>
                  <dd className="font-display text-2xl text-[#130E30]">{formatMoney(total)}</dd>
                </div>
              </dl>
              <p className="flex items-center gap-2 text-[13px] text-[#667085]">
                <ShieldCheck className="h-4 w-4 text-[#00B67A]" strokeWidth={1.5} />
                Secured by Paystack · verified organization
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </AppShell>
  );
}
