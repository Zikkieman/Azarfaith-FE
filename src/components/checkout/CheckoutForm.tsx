import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState, type FormEvent } from "react";
import {
  ChevronLeft,
  Building2,
  CreditCard,
  Lock,
  Repeat2,
  BellRing,
  Mail,
  BadgeCheck,
} from "lucide-react";
import { createDonation, getPaymentMethods, getOrganization } from "@/features/catalog/api";
import { apiFetch, ApiError } from "@/lib/api";
import { formatAmountInput, formatMoney, type Campaign } from "@/lib/catalog";
import {
  checkoutTotals,
  initialGiftAmount,
  formatCheckoutInput,
  parseCheckoutInput,
  paystackCheckoutUrl,
  validateCheckout,
  type CheckoutContext,
} from "@/lib/checkout";
import { isPublished } from "@/lib/discovery";
import { presets, frequencyLabel, everyLabel, hintFor, type Frequency } from "@/lib/design-giving";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { inputClass, labelClass } from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import { Switch } from "@/components/ui/switch";
import { Step, Option, Summary } from "./CheckoutParts";
import { cn } from "@/lib/utils";

const tipPresets = [0, 500, 1000, 2500];
const frequencyHint: Record<Frequency, string> = {
  once: "A single gift today",
  weekly: "Every week, cancel any time",
  monthly: "Every month, cancel any time",
  quarterly: "Every three months, cancel any time",
};

export function CheckoutForm({
  campaign,
  context,
  search,
  user,
}: {
  campaign: Campaign;
  context: CheckoutContext;
  search: { freq: string; amount: string; recurringGiftId: string };
  user: { id?: string; fullName: string; email: string } | null;
}) {
  const organization = useQuery({
    queryKey: ["organization", campaign.orgId, user?.id ?? user?.email ?? "guest"],
    queryFn: () => getOrganization(campaign.orgId!),
    enabled: Boolean(campaign.orgId),
    retry: false,
  });
  const org = organization.data;
  const gift = context.recurringGift;
  const [frequency, setFrequency] = useState(gift?.frequency.toLowerCase() ?? search.freq);
  const [amount, setAmount] = useState(
    formatAmountInput(String(gift?.amount ?? initialGiftAmount(search.amount || "10000"))),
  );
  const [customAmount, setCustomAmount] = useState(() =>
    gift
      ? formatCheckoutInput(String(gift.amount))
      : search.amount && !presets.includes(Number(search.amount))
        ? formatCheckoutInput(search.amount)
        : "",
  );
  const [presetAmount, setPresetAmount] = useState(() =>
    presets.includes(Number(search.amount)) ? Number(search.amount) : presets[1],
  );
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [name, setName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [anonymous, setAnonymous] = useState(false);
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"AUTO" | "PLEDGE">(gift?.mode ?? "AUTO");
  const [method, setMethod] = useState<"CARD" | "BANK">("CARD");
  const [consent, setConsent] = useState(false);
  const [savedCard, setSavedCard] = useState("");
  const [savedCardConsent, setSavedCardConsent] = useState(false);
  const [consentedTotal, setConsentedTotal] = useState<number | null>(null);
  const attempt = useRef<string | null>(null);
  const cards = useQuery({
    queryKey: ["payment-methods", user?.id ?? user?.email ?? "guest"],
    queryFn: getPaymentMethods,
    enabled: Boolean(user),
  });
  const [submitted, setSubmitted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const submitting = useRef(false);
  const recurring = frequency !== "once";
  const automatic = recurring && mode === "AUTO";
  const finalAmount = parseCheckoutInput(amount);
  const finalTip = customTip ? parseCheckoutInput(customTip) : tip;
  const displayedAmount = Number.isSafeInteger(finalAmount) && finalAmount >= 0 ? finalAmount : 0;
  const displayedTip = Number.isSafeInteger(finalTip) && finalTip >= 0 ? finalTip : 0;
  const totals = checkoutTotals(displayedAmount, displayedTip, context.platformFeePercent);
  const validSavedCardConsent = savedCardConsent && consentedTotal === totals.total;
  const input = {
    amount: finalAmount,
    tip: finalTip,
    name,
    email,
    note,
    frequency,
    mode,
    consent,
    authenticated: Boolean(user),
  };
  const errors = submitted ? validateCheckout(input, context) : {};
  const payment = useMutation({
    mutationFn: async () => {
      if (!recurring && user && savedCard) {
        attempt.current ??= crypto.randomUUID();
        const result = await apiFetch<{ reference: string; authorizationUrl?: string }>(
          `/campaigns/${encodeURIComponent(campaign.id)}/donations/saved-card`,
          {
            method: "POST",
            body: JSON.stringify({
              requestId: attempt.current,
              authorizationId: savedCard,
              savedCardConsent: validSavedCardConsent,
              expectedTotalCharged: totals.total,
              amount: finalAmount,
              tipAmount: finalTip,
              paymentMethod: "CARD",
              isAnonymous: anonymous,
              note: note.trim() || undefined,
            }),
          },
        );
        return result.authorizationUrl
          ? paystackCheckoutUrl(result.authorizationUrl)
          : `/donate/${encodeURIComponent(campaign.id)}?reference=${encodeURIComponent(result.reference)}`;
      }
      const result = await createDonation(campaign.id, {
        amount: finalAmount,
        tipAmount: finalTip,
        paymentMethod: automatic ? "CARD" : method,
        donorName: name.trim(),
        donorEmail: email.trim(),
        isAnonymous: anonymous,
        note: note.trim() || undefined,
        frequency: recurring
          ? (frequency.toUpperCase() as "WEEKLY" | "MONTHLY" | "QUARTERLY")
          : undefined,
        recurringMode: recurring ? mode : undefined,
        autoChargeConsent: automatic ? consent : undefined,
        recurringGiftId: gift?.id,
      });
      return paystackCheckoutUrl(result.authorizationUrl);
    },
    onSuccess: (url) => {
      setLeaving(true);
      window.location.assign(url);
    },
    onError: (error) => {
      // These validation/not-found responses occur before a pending saved-card claim.
      if (error instanceof ApiError && [400, 404].includes(error.status)) attempt.current = null;
      submitting.current = false;
    },
  });
  const busy = payment.isPending || leaving || Boolean(context.givingPaused);
  const fieldError = (field: string) =>
    errors[field] ? (
      <p id={`checkout-error-${field}`} className="mt-2 text-xs text-red-700" role="alert">
        {errors[field]}
      </p>
    ) : null;
  const fieldProps = (field: string) => ({
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? `checkout-error-${field}` : undefined,
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || !isPublished(campaign) || context.givingPaused) return;
    setSubmitted(true);
    const issues = validateCheckout(input, context);
    if (Object.keys(issues).length) {
      document.getElementById(`checkout-${Object.keys(issues)[0]}`)?.focus();
      return;
    }
    if (!recurring && savedCard && !validSavedCardConsent) {
      document.getElementById("saved-card-consent")?.focus();
      return;
    }
    submitting.current = true;
    payment.mutate();
  }

  if (!isPublished(campaign))
    return (
      <main className="mx-auto max-w-xl px-6 py-14 text-center">
        <AuthLogo />
        <h1 className="mt-6 font-display text-[26px] text-ink">
          This campaign isn't accepting donations
        </h1>
        <p className="mt-3 text-sm text-muted-ink">
          It needs to be approved before giving is available.
        </p>
        <Link
          to="/campaign/$id"
          params={{ id: campaign.id }}
          className={cn(btn("secondary"), "mt-6")}
        >
          Back to campaign
        </Link>
      </main>
    );

  const freqs: Frequency[] =
    campaign.mode === "ongoing"
      ? [...context.frequencies.map((f) => f.toLowerCase() as Frequency), "once"]
      : ["once"];
  const recurringCount = freqs.length > 1;
  const eligibleCards =
    cards.data?.filter(
      (card) => card.active && !card.deactivatedAt && card.reusable && card.channel === "card",
    ) ?? [];
  const changeAmount = (value: string) => {
    setAmount(value);
    setConsent(false);
    setSavedCardConsent(false);
  };
  const clearSavedCard = () => {
    setSavedCard("");
    setSavedCardConsent(false);
    setConsentedTotal(null);
  };
  const cta = (
    <button
      type="submit"
      form="donation-checkout"
      disabled={busy}
      className={cn(btn("primary", "lg"), "w-full")}
    >
      <Lock className="h-4 w-4" strokeWidth={2} />{" "}
      {context.givingPaused
        ? "Giving paused"
        : busy
          ? "Opening Paystack..."
          : `Give ${formatMoney(totals.total)}${automatic ? " " + (everyLabel[frequency as Exclude<Frequency, "once">] ?? "") : ""}`}
    </button>
  );

  return (
    <div className="min-h-screen bg-paper font-gsf text-heading lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)]">
      <div className="pb-32 lg:pb-16">
        <header className="flex items-center justify-between gap-4 px-6 py-5 sm:px-10">
          <Link to="/" aria-label="AzarFaith home">
            <AuthLogo />
          </Link>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-ink">
            <Lock className="h-3.5 w-3.5" strokeWidth={2} /> Secure checkout
          </span>
        </header>
        <main className="mx-auto flex w-full max-w-[600px] flex-col gap-10 px-6 pt-4 sm:px-10">
          <div className="flex flex-col gap-3">
            <Link
              to="/campaign/$id"
              params={{ id: campaign.id }}
              className="inline-flex w-fit items-center gap-1 text-sm text-muted-ink transition-colors hover:text-ink"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.75} /> Back to campaign
            </Link>
            <h1 className="font-display text-[clamp(26px,2.6vw,34px)] leading-[1.15] tracking-[-0.02em] text-ink">
              Your gift to {org?.name ?? campaign.raiser.name}
            </h1>
            <p className="text-[15px] text-ink-soft">{campaign.title}</p>
          </div>
          {context.givingPaused && (
            <p role="status" className="rounded-field bg-panel p-4 text-sm text-ink-soft">
              Giving is temporarily paused by the AzarFaith team. Please try again later. Existing
              payment confirmations are still being processed.
            </p>
          )}
          <form id="donation-checkout" onSubmit={submit} noValidate className="contents">
            <fieldset
              disabled={busy || (payment.isError && Boolean(attempt.current))}
              className="contents"
            >
              {recurringCount && (
                <Step n={1} title="How often">
                  <div
                    id="checkout-frequency"
                    tabIndex={-1}
                    role="radiogroup"
                    aria-label="Giving frequency"
                    className="grid gap-2 sm:grid-cols-2"
                  >
                    {freqs.map((f) => (
                      <Option
                        key={f}
                        selected={frequency === f}
                        disabled={Boolean(gift)}
                        onClick={() => {
                          setFrequency(f);
                          setConsent(false);
                          clearSavedCard();
                        }}
                      >
                        <span className="flex items-center gap-2 text-[15px] font-medium text-ink">
                          {frequencyLabel[f]}
                        </span>
                        <span className="text-[13px] text-muted-ink">{frequencyHint[f]}</span>
                      </Option>
                    ))}
                  </div>
                  {fieldError("frequency")}
                  {recurring && !user && (
                    <p className="text-sm text-muted-ink">
                      <Link
                        to="/login"
                        search={{
                          returnTo:
                            "/donate/" +
                            encodeURIComponent(campaign.id) +
                            "?" +
                            new URLSearchParams({ freq: frequency, amount }),
                        }}
                        className="underline"
                      >
                        Sign in for recurring giving
                      </Link>
                      , or choose One time to give without an account.
                    </p>
                  )}
                </Step>
              )}
              <Step n={recurringCount ? 2 : 1} title="Amount">
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Gift amount">
                  {presets
                    .filter((p) => p >= context.minDonation && p <= context.maxDonation)
                    .map((p) => (
                      <Option
                        key={p}
                        selected={!customAmount && finalAmount === p}
                        disabled={Boolean(gift)}
                        onClick={() => {
                          setCustomAmount("");
                          setPresetAmount(p);
                          changeAmount(formatCheckoutInput(String(p)));
                        }}
                      >
                        <span className="font-display text-[19px] leading-tight text-ink">
                          {formatMoney(p)}
                        </span>
                        {hintFor(campaign, p) && (
                          <span className="text-[13px] text-muted-ink">{hintFor(campaign, p)}</span>
                        )}
                      </Option>
                    ))}
                </div>
                <label className="relative mt-2 block">
                  <span className="sr-only">Another amount</span>
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-ink">
                    ₦
                  </span>
                  <input
                    id="checkout-amount"
                    inputMode="numeric"
                    readOnly={Boolean(gift)}
                    value={customAmount}
                    onChange={(e) => {
                      const value = formatCheckoutInput(e.target.value);
                      setCustomAmount(value);
                      changeAmount(value || formatCheckoutInput(String(presetAmount)));
                    }}
                    placeholder="Another amount"
                    className={cn(inputClass, "pl-8")}
                    {...fieldProps("amount")}
                  />
                </label>
                {fieldError("amount")}
                {gift && (
                  <p className="text-[13px] text-muted-ink">
                    This gift's amount and schedule are fixed by your existing recurring setup.
                  </p>
                )}
              </Step>
              <Step n={recurringCount ? 3 : 2} title="A tip for AzarFaith" optional>
                <div className="flex flex-col gap-3 rounded-field bg-panel p-4">
                  <p className="text-sm text-ink-soft">
                    Tips pay for verifying organizations, so churches and missions never pay to
                    join.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tipPresets.map((t) => (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={!customTip && tip === t}
                        onClick={() => {
                          setTip(t);
                          setCustomTip("");
                          setSavedCardConsent(false);
                        }}
                        className={cn(
                          "h-9 rounded-[10px] border px-3.5 text-sm font-medium transition-colors",
                          !customTip && tip === t
                            ? "border-ink bg-ink text-ink-contrast"
                            : "border-line-input bg-paper text-ink hover:border-ink",
                        )}
                      >
                        {t ? formatMoney(t) : "No tip"}
                      </button>
                    ))}
                  </div>
                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>Custom tip (optional)</span>
                    <input
                      id="checkout-tip"
                      inputMode="numeric"
                      value={customTip}
                      onChange={(e) => {
                        setCustomTip(formatCheckoutInput(e.target.value));
                        setSavedCardConsent(false);
                      }}
                      placeholder="Another tip amount"
                      className={inputClass}
                      {...fieldProps("tip")}
                    />
                  </label>
                  {fieldError("tip")}
                </div>
              </Step>
              <Step n={recurringCount ? 4 : 3} title="Your details">
                <div className="flex flex-col gap-4">
                  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-field border border-line-soft px-4 py-3">
                    <span>
                      <span className="block text-sm font-medium text-ink">Give anonymously</span>
                      <span className="block text-[13px] text-muted-ink">
                        Your public name will be Anonymous Donor. Your receipt still uses your real
                        name.
                      </span>
                    </span>
                    <Switch
                      checked={anonymous}
                      onCheckedChange={setAnonymous}
                      className="data-[state=checked]:bg-ink data-[state=unchecked]:bg-line-input"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>
                      {anonymous ? "Name for your receipt" : "Name on the campaign"}
                    </span>
                    <input
                      id="checkout-name"
                      autoComplete="name"
                      maxLength={120}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                      {...fieldProps("name")}
                    />
                  </label>
                  {fieldError("name")}
                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>Email address</span>
                    <input
                      id="checkout-email"
                      type="email"
                      autoComplete="email"
                      maxLength={160}
                      readOnly={Boolean(user)}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      {...fieldProps("email")}
                    />
                  </label>
                  {fieldError("email")}
                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>
                      Message <span className="font-normal text-muted-ink">(optional)</span>
                    </span>
                    <textarea
                      id="checkout-note"
                      rows={3}
                      maxLength={500}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Praying for you and the team"
                      className={cn(inputClass, "resize-none")}
                      {...fieldProps("note")}
                    />
                  </label>
                  {fieldError("note")}
                </div>
              </Step>
              <Step n={recurringCount ? 5 : 4} title="Payment">
                <div className="flex flex-col gap-2" role="radiogroup" aria-label="Payment method">
                  {!recurring &&
                    user &&
                    eligibleCards.map((card) => (
                      <Option
                        key={card.id}
                        row
                        selected={savedCard === card.id}
                        onClick={() => {
                          setSavedCard(card.id);
                          setSavedCardConsent(false);
                          setMethod("CARD");
                        }}
                      >
                        <CreditCard className="h-5 w-5 text-ink-soft" strokeWidth={1.5} />
                        <span className="flex-1">
                          <span className="block text-[15px] font-medium text-ink">
                            {card.cardType || card.brand || "Card"} ending {card.last4}
                          </span>
                          <span className="block text-[13px] text-muted-ink">
                            Saved card
                            {card.expMonth && card.expYear
                              ? ", expires " + card.expMonth + "/" + card.expYear
                              : ""}
                          </span>
                        </span>
                      </Option>
                    ))}
                  <Option
                    row
                    selected={method === "CARD" && !savedCard}
                    onClick={() => {
                      setMethod("CARD");
                      clearSavedCard();
                    }}
                  >
                    <CreditCard className="h-5 w-5 text-ink-soft" strokeWidth={1.5} />
                    <span className="flex-1 text-[15px] font-medium text-ink">
                      {eligibleCards.length && !recurring ? "A different card" : "Card"}
                    </span>
                  </Option>
                  <Option
                    row
                    selected={method === "BANK"}
                    disabled={automatic}
                    onClick={() => {
                      setMethod("BANK");
                      clearSavedCard();
                    }}
                  >
                    <Building2 className="h-5 w-5 text-ink-soft" strokeWidth={1.5} />
                    <span className="flex-1">
                      <span className="block text-[15px] font-medium text-ink">Bank transfer</span>
                      <span className="block text-[13px] text-muted-ink">
                        {automatic
                          ? "Choose reminders to pay by bank"
                          : recurring
                            ? "We remind you each time it's due"
                            : "Pay from your banking app"}
                      </span>
                    </span>
                  </Option>
                </div>
                {!recurring && cards.isError && (
                  <p role="alert" className="text-sm text-red-700">
                    Saved cards could not load.{" "}
                    <button
                      type="button"
                      onClick={() => void cards.refetch()}
                      className="underline"
                    >
                      Retry
                    </button>{" "}
                    or use a new card.
                  </p>
                )}
                {savedCard && !recurring ? (
                  <label className="flex items-start gap-3 text-sm leading-6 text-ink-soft">
                    <input
                      id="saved-card-consent"
                      type="checkbox"
                      checked={validSavedCardConsent}
                      onChange={(e) => {
                        setSavedCardConsent(e.target.checked);
                        setConsentedTotal(e.target.checked ? totals.total : null);
                      }}
                      className="mt-1.5"
                    />
                    <span>
                      I authorize a one-time charge of {formatMoney(totals.total)} to this saved
                      card, including the displayed fee and tip. No recurring gift is created.
                    </span>
                  </label>
                ) : (
                  <p className="rounded-field bg-panel px-4 py-3 text-[13px] text-ink-soft">
                    Paystack opens a secure window for your payment details. AzarFaith never sees or
                    stores your card details.
                  </p>
                )}
                {submitted && savedCard && !validSavedCardConsent && (
                  <p role="alert" className="text-sm text-red-700">
                    Confirm the one-time saved-card charge to continue.
                  </p>
                )}
                {recurring && user && (
                  <div
                    className="mt-2 grid gap-2 sm:grid-cols-2"
                    role="radiogroup"
                    aria-label="Recurring giving mode"
                  >
                    <Option
                      selected={mode === "AUTO"}
                      disabled={Boolean(gift)}
                      onClick={() => {
                        setMode("AUTO");
                        setConsent(false);
                        setMethod("CARD");
                      }}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-ink">
                        <Repeat2 className="h-4 w-4" strokeWidth={1.75} /> Charge me automatically
                      </span>
                      <span className="text-[13px] text-muted-ink">Nothing to remember</span>
                    </Option>
                    <Option
                      selected={mode === "PLEDGE"}
                      disabled={Boolean(gift)}
                      onClick={() => {
                        setMode("PLEDGE");
                        setConsent(false);
                      }}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-ink">
                        <BellRing className="h-4 w-4" strokeWidth={1.75} /> Remind me each time
                      </span>
                      <span className="text-[13px] text-muted-ink">You confirm every gift</span>
                    </Option>
                  </div>
                )}
                {automatic && user && !gift && (
                  <label className="flex items-start gap-3 text-sm leading-6 text-ink-soft">
                    <input
                      id="checkout-consent"
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1.5"
                      {...fieldProps("consent")}
                    />
                    <span>
                      I authorize automatic {frequency} card charges of{" "}
                      {formatMoney(displayedAmount)} plus the applicable platform fee for this
                      campaign. I can pause or cancel in My Giving.
                    </span>
                  </label>
                )}
                {fieldError("consent")}
              </Step>
            </fieldset>
            <details className="rounded-field border border-line-soft p-4 lg:hidden">
              <summary className="cursor-pointer text-sm font-medium text-ink">
                Your giving summary
              </summary>
              <div className="pt-4">
                <Summary
                  cover={campaign.cover}
                  title={campaign.title}
                  org={org?.name ?? campaign.raiser.name}
                  verified={Boolean(org && isPublished(org))}
                  gift={displayedAmount}
                  fee={totals.platformFee}
                  tip={displayedTip}
                  total={totals.total}
                  freq={frequency as Frequency}
                  feePercent={context.platformFeePercent}
                  mode={mode}
                />
              </div>
            </details>
            {payment.error && (
              <div
                className="rounded-field border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                role="alert"
              >
                {payment.error.message}{" "}
                {attempt.current
                  ? "Retry this same payment attempt to check its result before starting a different gift."
                  : "You can retry when you're ready."}
              </div>
            )}
          </form>
        </main>
      </div>
      <aside
        className="hidden border-l border-line-soft bg-panel lg:block"
        aria-label="Giving summary"
      >
        <div className="sticky top-0 flex min-h-screen flex-col gap-6 px-8 py-10">
          <Summary
            cover={campaign.cover}
            title={campaign.title}
            org={org?.name ?? campaign.raiser.name}
            verified={Boolean(org && isPublished(org))}
            gift={displayedAmount}
            fee={totals.platformFee}
            tip={displayedTip}
            total={totals.total}
            freq={frequency as Frequency}
            feePercent={context.platformFeePercent}
            mode={mode}
          />
          {cta}
          <ul className="flex flex-col gap-2 text-[13px] text-muted-ink">
            <li className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-verified" strokeWidth={1.75} /> Campaigns are
              reviewed before giving opens
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" strokeWidth={1.75} /> Your receipt is emailed after payment
              confirmation
            </li>
            {recurring && (
              <li className="flex items-center gap-2">
                <Repeat2 className="h-4 w-4" strokeWidth={1.75} /> Change or stop it any time in My
                giving
              </li>
            )}
          </ul>
        </div>
      </aside>
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t border-line-soft bg-paper px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-muted-ink">Total today, fee included</p>
          <p className="break-words font-display text-[20px] leading-tight text-ink">
            {formatMoney(totals.total)}
          </p>
        </div>
        <button type="submit" form="donation-checkout" disabled={busy} className={btn("primary")}>
          {context.givingPaused ? "Giving paused" : busy ? "Opening..." : "Give"}
        </button>
      </div>
    </div>
  );
}
