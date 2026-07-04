import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Building2, Check, ChevronLeft, CreditCard, Info, Repeat2 } from "lucide-react";
import { toast } from "sonner";

import { Navbar } from "@/components/Navbar";
import { PageSpinner } from "@/components/PageSpinner";
import { createDonation, getCampaign, verifyDonation } from "@/features/catalog/api";
import { formatAmountInput, frequencyLabel, formatMoney, parseAmountInput } from "@/lib/catalog";

export const Route = createFileRoute("/donate/$id")({
  validateSearch: (search: Record<string, unknown>) => ({
    freq: (search.freq as string) ?? "",
    reference: (search.reference as string) ?? "",
    trxref: (search.trxref as string) ?? "",
    amount: (search.amount as string) ?? "",
    recurringGiftId: (search.recurringGiftId as string) ?? "",
  }),
  component: AzarFaithDonate,
});

const presets = [2000, 5000, 10000, 25000, 50000];

function AzarFaithDonate() {
  const { id } = Route.useParams();
  const { freq, reference, trxref, amount: amountPrefill, recurringGiftId } = Route.useSearch();
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => getCampaign(id),
  });

  const prefilledAmount = Number(amountPrefill || 0);
  const hasPresetMatch = presets.includes(prefilledAmount);

  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState(hasPresetMatch ? prefilledAmount : 0);
  const [customAmount, setCustomAmount] = useState(hasPresetMatch || !prefilledAmount ? "" : formatAmountInput(String(prefilledAmount)));
  const [payMethod, setPayMethod] = useState<"CARD" | "BANK">("CARD");
  const [recurringMode, setRecurringMode] = useState<"AUTO" | "PLEDGE">("AUTO");
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [note, setNote] = useState("");
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [autoChargeConsent, setAutoChargeConsent] = useState(false);
  const [done, setDone] = useState(false);
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  const isRecurring = Boolean(freq && freq !== "once");
  const paystackReference = reference || trxref;
  const finalAmount = customAmount ? parseAmountInput(customAmount) : amount;
  const finalTip = customTip ? parseAmountInput(customTip) : tip;
  const platformFee = Math.round(finalAmount * 0.025);
  const total = finalAmount + platformFee + finalTip;
  const steps = isRecurring ? ["Amount", "How to give", "Payment", "Review"] : ["Amount", "Payment", "Review"];

  const donationMutation = useMutation({
    mutationFn: () =>
      createDonation(id, {
        amount: finalAmount,
        paymentMethod: payMethod,
        frequency: isRecurring ? (freq.toUpperCase() as "WEEKLY" | "MONTHLY" | "QUARTERLY") : undefined,
        recurringMode: isRecurring ? recurringMode : undefined,
        autoChargeConsent: isRecurring && recurringMode === "AUTO" ? autoChargeConsent : undefined,
        donorName: anonymous ? undefined : name || undefined,
        isAnonymous: anonymous,
        note: note || undefined,
        tipAmount: finalTip,
        recurringGiftId: recurringGiftId || undefined,
      }),
    onSuccess: (result) => {
      window.location.assign(result.authorizationUrl);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const verifyDonationMutation = useMutation({
    mutationFn: (currentReference: string) => verifyDonation(id, currentReference),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-gifts"] });
      toast.success(result.message);
      setDone(true);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!paystackReference || verificationAttempted) return;
    setVerificationAttempted(true);
    verifyDonationMutation.mutate(paystackReference);
  }, [paystackReference, verificationAttempted, verifyDonationMutation]);

  if (!isLoading && !campaign) throw notFound();
  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageSpinner label="Loading campaign..." />
      </div>
    );
  }

  const next = () => {
    if (step === 0 && finalAmount < 100) {
      toast.error("Minimum donation is ₦100");
      return;
    }
    if (isRecurring && step === 1 && recurringMode === "AUTO" && !autoChargeConsent) {
      toast.error("Please confirm the automatic charge consent before continuing.");
      return;
    }
    setStep((value) => value + 1);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
          <div className="mb-6 grid h-24 w-24 place-items-center rounded-full bg-amber-100">
            <Check className="h-14 w-14 text-amber-500" />
          </div>
          <h1 className="font-display text-3xl">Thank you</h1>
          <p className="mt-2 max-w-sm text-muted-foreground">
            {isRecurring
              ? `Your ${frequencyLabel[freq as keyof typeof frequencyLabel].toLowerCase()} gift of ${formatMoney(finalAmount)} is set up.`
              : `Your gift of ${formatMoney(finalAmount)} has been confirmed.`}
          </p>
          <div className="mt-8 w-full max-w-xs space-y-3">
            <Link to="/campaign/$id" params={{ id: campaign.id }} className="block w-full rounded-2xl bg-amber-500 py-3.5 text-center font-semibold text-white transition hover:bg-amber-600">
              Back to campaign
            </Link>
            <Link to="/discover" className="block w-full rounded-2xl border border-border py-3.5 text-center text-sm font-medium transition hover:bg-muted">
              Discover more causes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-md px-5 py-8">
        <button onClick={() => (step > 0 ? setStep((value) => value - 1) : nav({ to: "/campaign/$id", params: { id } }))} className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <img src={campaign.cover} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-amber-600">{campaign.faithCategory}</p>
            <p className="line-clamp-1 text-sm font-medium">{campaign.title}</p>
            {freq && <p className="mt-0.5 text-xs text-muted-foreground">{frequencyLabel[freq as keyof typeof frequencyLabel] ?? "One time"}</p>}
          </div>
        </div>

        <div className="mb-8 flex items-center gap-2">
          {steps.map((label, index) => (
            <div key={label} className="flex flex-1 items-center gap-2 last:flex-none">
              <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${index <= step ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}>
                {index < step ? <Check className="h-3 w-3" /> : index + 1}
              </div>
              <span className={`hidden text-xs sm:block ${index === step ? "font-medium text-foreground" : "text-muted-foreground"}`}>{label}</span>
              {index < steps.length - 1 && <div className={`h-px flex-1 ${index < step ? "bg-amber-400" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl">How much?</h2>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((preset) => (
                <button key={preset} onClick={() => { setAmount(preset); setCustomAmount(""); }} className={`rounded-xl border py-3 text-sm font-medium transition ${amount === preset && !customAmount ? "border-amber-400 bg-amber-50 text-amber-800" : "border-border hover:border-amber-200"}`}>
                  {formatMoney(preset)}
                </button>
              ))}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Or enter amount (₦)</label>
              <input type="text" inputMode="numeric" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" value={customAmount} onChange={(event) => { setCustomAmount(formatAmountInput(event.target.value)); setAmount(0); }} />
            </div>
            {finalAmount > 0 && (
              <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> 2.5% platform fee ({formatMoney(platformFee)}) helps keep AzarFaith running.
              </div>
            )}
          </div>
        )}

        {isRecurring && step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl">How would you like to give?</h2>
            {[
              { value: "AUTO", label: "Automatic", desc: "Your first donation goes through Paystack checkout. If Paystack returns a reusable authorization, later scheduled charges can run automatically until you cancel." },
              { value: "PLEDGE", label: "Reminder / pledge", desc: "Reminder emails and missed-pledge tracking are now active." },
            ].map((option) => (
              <button key={option.value} onClick={() => setRecurringMode(option.value as "AUTO" | "PLEDGE")} className={`w-full rounded-2xl border p-4 text-left transition ${recurringMode === option.value ? "border-amber-400 bg-amber-50" : "border-border hover:border-amber-200"}`}>
                <div className="text-sm font-semibold">{option.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{option.desc}</div>
              </button>
            ))}
            {recurringMode === "AUTO" ? (
              <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <input
                  type="checkbox"
                  checked={autoChargeConsent}
                  onChange={(event) => setAutoChargeConsent(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-amber-500"
                />
                <span>
                  I authorize AzarFaith to reuse a saved Paystack authorization for future scheduled charges on this recurring gift until I cancel it from My Giving.
                </span>
              </label>
            ) : null}
          </div>
        )}

        {step === (isRecurring ? 2 : 1) && (
          <div className="space-y-4">
            <h2 className="font-display text-xl">Payment method</h2>
            {[
              { value: "CARD", icon: CreditCard, label: "Debit / Credit card", desc: "Complete your donation securely through Paystack." },
              { value: "BANK", icon: Building2, label: "Bank transfer", desc: "Reserved for the manual transfer flow when that backend path is enabled." },
            ].map((method) => (
              <button
                key={method.value}
                onClick={() => {
                  if (isRecurring && recurringMode === "AUTO" && method.value === "BANK") {
                    return;
                  }
                  setPayMethod(method.value as "CARD" | "BANK");
                }}
                disabled={isRecurring && recurringMode === "AUTO" && method.value === "BANK"}
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 transition ${
                  payMethod === method.value ? "border-amber-400 bg-amber-50" : "border-border hover:border-amber-200"
                } ${
                  isRecurring && recurringMode === "AUTO" && method.value === "BANK"
                    ? "cursor-not-allowed opacity-50 hover:border-border"
                    : ""
                }`}
              >
                <method.icon className={`h-5 w-5 ${payMethod === method.value ? "text-amber-600" : "text-muted-foreground"}`} />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{method.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {isRecurring && recurringMode === "AUTO" && method.value === "BANK"
                      ? "Automatic recurring gifts require a reusable card authorization, so bank transfer is not available here."
                      : method.desc}
                  </div>
                </div>
                {payMethod === method.value && <Check className="h-4 w-4 text-amber-500" />}
              </button>
            ))}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="anon" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} className="h-4 w-4 rounded accent-amber-500" />
                <label htmlFor="anon" className="text-sm">Give anonymously</label>
              </div>
              {!anonymous && <input className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Your name (optional)" value={name} onChange={(event) => setName(event.target.value)} />}
              <input className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Leave a message (optional)" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
            <div className="rounded-2xl border border-border bg-card/60 p-4">
              <p className="text-sm font-medium">Add a tip to AzarFaith</p>
              <p className="mt-1 text-xs text-muted-foreground">
                This tip supports the AzarFaith platform directly. It does not go to the campaign beneficiary.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {[0, 500, 1000, 2500].map((tipValue) => (
                  <button
                    key={tipValue}
                    onClick={() => {
                      setTip(tipValue);
                      setCustomTip("");
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${finalTip === tipValue && !customTip ? "bg-amber-500 text-white" : "border border-border hover:border-amber-300"}`}
                  >
                    {tipValue === 0 ? "None" : formatMoney(tipValue)}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <label className="mb-1.5 block text-sm font-medium">Custom tip for AzarFaith (optional)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Enter custom tip"
                  value={customTip}
                  onChange={(event) => {
                    setCustomTip(formatAmountInput(event.target.value));
                    setTip(0);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {step === (isRecurring ? 3 : 2) && (
          <div className="space-y-4">
            <h2 className="font-display text-xl">Review</h2>
            <div className="divide-y divide-border rounded-2xl border border-border bg-card text-sm">
              {[
                { label: "Donation", value: formatMoney(finalAmount) },
                { label: "Platform fee (2.5%)", value: formatMoney(platformFee) },
                ...(finalTip > 0 ? [{ label: "Tip to AzarFaith", value: formatMoney(finalTip) }] : []),
                { label: "Total", value: formatMoney(total) },
              ].map((item) => (
                <div key={item.label} className={`flex items-center justify-between px-4 py-3 ${item.label === "Total" ? "font-semibold" : ""}`}>
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="divide-y divide-border rounded-2xl border border-border bg-card text-sm">
              <div className="flex items-center justify-between px-4 py-3"><span className="text-muted-foreground">To</span><span className="font-medium">{campaign.title}</span></div>
              <div className="flex items-center justify-between px-4 py-3"><span className="text-muted-foreground">From</span><span>{anonymous ? "Anonymous" : name || "You"}</span></div>
              <div className="flex items-center justify-between px-4 py-3"><span className="text-muted-foreground">Payment</span><span>{payMethod === "CARD" ? "Card" : "Bank transfer"}</span></div>
              {isRecurring && (
                <>
                  <div className="flex items-center justify-between px-4 py-3"><span className="text-muted-foreground">Frequency</span><span>{frequencyLabel[freq as keyof typeof frequencyLabel]}</span></div>
                  <div className="flex items-center justify-between px-4 py-3"><span className="text-muted-foreground">Mode</span><span>{recurringMode === "AUTO" ? "Automatic" : "Reminder"}</span></div>
                  {recurringMode === "AUTO" ? (
                    <div className="flex items-center justify-between px-4 py-3"><span className="text-muted-foreground">Consent</span><span>{autoChargeConsent ? "Granted" : "Not granted"}</span></div>
                  ) : null}
                </>
              )}
            </div>
            {isRecurring && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <Repeat2 className="mr-1.5 inline h-4 w-4" /> {recurringMode === "AUTO"
                  ? "Your first payment is completed in Paystack. After that, AzarFaith can use the reusable authorization Paystack returns for future scheduled charges until you cancel."
                  : "Pledge reminders, missed-pledge tracking, and recurring retry scheduling are active."}
              </div>
            )}
          </div>
        )}

        {verifyDonationMutation.isPending && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Confirming your Paystack payment and updating the campaign totals...
          </div>
        )}

        <div className="mt-8">
          {step < steps.length - 1 ? (
            <button onClick={next} className="w-full rounded-2xl bg-amber-500 py-4 font-semibold text-white transition hover:bg-amber-600">
              Continue
            </button>
          ) : (
            <button onClick={() => donationMutation.mutate()} disabled={donationMutation.isPending || verifyDonationMutation.isPending} className="w-full rounded-2xl bg-amber-500 py-4 font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60">
              {donationMutation.isPending ? "Redirecting to Paystack…" : verifyDonationMutation.isPending ? "Confirming payment…" : `Confirm — ${formatMoney(total)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
