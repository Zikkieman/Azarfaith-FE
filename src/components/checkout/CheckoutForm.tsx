import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Building2, CreditCard, Heart, LockKeyhole } from "lucide-react";
import { createDonation, getPaymentMethods } from "@/features/catalog/api";
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

const amountPresets = [2000, 5000, 10000, 25000, 50000];
const tipPresets = [0, 500, 1000, 2500];
const frequencyNames: Record<string, string> = {
  once: "One-time",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-[#eeeaf2] py-7">
      <h2 className="mb-5 flex items-center gap-3 text-base font-semibold">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[#f2f0f5] text-xs">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function CheckoutForm({
  campaign,
  context,
  search,
  user,
}: {
  campaign: Campaign;
  context: CheckoutContext;
  search: { freq: string; amount: string; recurringGiftId: string };
  user: { fullName: string; email: string } | null;
}) {
  const gift = context.recurringGift;
  const [frequency, setFrequency] = useState(gift?.frequency.toLowerCase() ?? search.freq);
  const [amount, setAmount] = useState(
    formatAmountInput(String(gift?.amount ?? initialGiftAmount(search.amount))),
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
    queryKey: ["payment-methods"],
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
      <main className="mx-auto max-w-xl px-5 py-14 text-center">
        <h1 className="text-2xl font-semibold">This campaign isn't accepting donations</h1>
        <p className="mt-3 text-sm text-[#686479]">
          It needs to be approved before giving is available.
        </p>
        <Link to="/campaign/$id" params={{ id: campaign.id }} className="public-button mt-6">
          Back to campaign
        </Link>
      </main>
    );

  return (
    <>
      {context.givingPaused && (
        <div
          role="status"
          className="mx-auto my-5 max-w-5xl rounded-xl border border-amber-300 bg-amber-50 p-5 text-center text-sm"
        >
          Giving is temporarily paused by the AzarFaith team. Please try again later. Existing
          payment confirmations are still being processed.
        </div>
      )}
      <main className="checkout-grid mx-auto max-w-[1280px] px-5 pb-32 md:px-10 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16 lg:pb-12 xl:gap-24">
        <div className="min-w-0 pb-6">
          <Link
            to="/campaign/$id"
            params={{ id: campaign.id }}
            className="inline-flex items-center gap-2 text-sm text-[#686479]"
          >
            <ArrowLeft size={15} />
            Back to campaign
          </Link>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Make a difference today</h1>
          <p className="mt-3 text-sm leading-6 text-[#686479]">
            Support {campaign.raiser.name || "this cause"}. Every gift helps the work continue.
          </p>
          <form id="donation-checkout" onSubmit={submit} noValidate>
            <fieldset
              disabled={busy || (payment.isError && Boolean(attempt.current))}
              className="min-w-0"
            >
              <Section number={1} title="How often would you like to give?">
                <div
                  id="checkout-frequency"
                  tabIndex={-1}
                  role="group"
                  aria-label="Giving frequency"
                  className="flex flex-wrap gap-2"
                >
                  {["once", ...context.frequencies.map((value) => value.toLowerCase())].map(
                    (value) => (
                      <button
                        key={value}
                        type="button"
                        disabled={Boolean(gift)}
                        aria-pressed={frequency === value}
                        className="checkout-choice"
                        onClick={() => {
                          setFrequency(value);
                          setConsent(false);
                        }}
                      >
                        {frequencyNames[value]}
                      </button>
                    ),
                  )}
                </div>
                {gift && (
                  <p className="mt-3 text-xs text-[#686479]">
                    You are completing an existing{" "}
                    {gift.mode === "PLEDGE" ? "pledge" : "recurring gift"}. Its amount and schedule
                    are preserved.
                  </p>
                )}
                {recurring && !user && (
                  <p className="mt-4 rounded-xl bg-[#f7f6fa] p-4 text-sm leading-6">
                    <Link
                      to="/login"
                      search={{
                        returnTo: `/donate/${encodeURIComponent(campaign.id)}?${new URLSearchParams({ amount: String(displayedAmount), freq: frequency, ...(gift ? { recurringGiftId: gift.id } : {}) })}`,
                      }}
                      className="font-semibold underline"
                    >
                      Log in
                    </Link>{" "}
                    to manage recurring giving. You can donate as a guest by choosing One-time.
                  </p>
                )}
                {fieldError("frequency")}
              </Section>
              <Section number={2} title="Choose your gift amount">
                <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {amountPresets
                    .filter((value) => value >= context.minDonation && value <= context.maxDonation)
                    .map((value) => (
                      <button
                        type="button"
                        disabled={Boolean(gift)}
                        key={value}
                        aria-pressed={finalAmount === value}
                        className="checkout-choice px-2"
                        onClick={() => {
                          setAmount(formatAmountInput(String(value)));
                          setConsent(false);
                          setSavedCardConsent(false);
                        }}
                      >
                        {formatMoney(value)}
                      </button>
                    ))}
                </div>
                <label htmlFor="checkout-amount" className="mb-2 block text-sm font-medium">
                  Your amount (NGN)
                </label>
                <input
                  id="checkout-amount"
                  inputMode="numeric"
                  className="public-input"
                  value={amount}
                  readOnly={Boolean(gift)}
                  onChange={(event) => {
                    setAmount(formatCheckoutInput(event.target.value));
                    setConsent(false);
                    setSavedCardConsent(false);
                  }}
                  {...fieldProps("amount")}
                />
                {fieldError("amount")}
                <p className="mt-3 text-xs leading-5 text-[#686479]">
                  Minimum {formatMoney(context.minDonation)}. Enter whole Nigerian naira amounts.
                </p>
              </Section>
              <Section number={3} title="Support AzarFaith (optional)">
                <p className="mb-4 text-sm leading-6 text-[#686479]">
                  Your tip goes to AzarFaith, not the campaign, and helps keep the platform running.
                  {recurring && " This tip applies to this payment only."}
                </p>
                <div className="mb-4 grid grid-cols-4 gap-2">
                  {tipPresets.map((value) => (
                    <button
                      type="button"
                      key={value}
                      aria-pressed={!customTip && tip === value}
                      className="checkout-choice px-2"
                      onClick={() => {
                        setTip(value);
                        setCustomTip("");
                        setSavedCardConsent(false);
                      }}
                    >
                      {value ? formatMoney(value) : "No tip"}
                    </button>
                  ))}
                </div>
                <label htmlFor="checkout-tip" className="mb-2 block text-sm font-medium">
                  Custom AzarFaith tip (NGN)
                </label>
                <input
                  id="checkout-tip"
                  inputMode="numeric"
                  className="public-input"
                  placeholder="Enter a custom tip"
                  value={customTip}
                  onChange={(event) => {
                    setTip(0);
                    setCustomTip(formatCheckoutInput(event.target.value));
                    setSavedCardConsent(false);
                  }}
                  {...fieldProps("tip")}
                />
                {fieldError("tip")}
              </Section>
              <Section number={4} title="Your details">
                <p className="mb-5 text-sm text-[#686479]">
                  We use your real name and email for your donation receipt.
                </p>
                <div className="space-y-5">
                  <div>
                    <label htmlFor="checkout-name" className="mb-2 block text-sm font-medium">
                      Full name
                    </label>
                    <input
                      id="checkout-name"
                      className="public-input"
                      autoComplete="name"
                      maxLength={120}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      {...fieldProps("name")}
                    />
                    {fieldError("name")}
                  </div>
                  <div>
                    <label htmlFor="checkout-email" className="mb-2 block text-sm font-medium">
                      Email address
                    </label>
                    <input
                      id="checkout-email"
                      className="public-input"
                      autoComplete="email"
                      type="email"
                      maxLength={160}
                      readOnly={Boolean(user)}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      {...fieldProps("email")}
                    />
                    {fieldError("email")}
                    {user && (
                      <p className="mt-2 text-xs text-[#686479]">
                        Your receipt goes to your account email.
                      </p>
                    )}
                  </div>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={anonymous}
                      onChange={(event) => setAnonymous(event.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      Give anonymously
                      <span className="mt-1 block text-xs leading-5 text-[#686479]">
                        Your public name will be Anonymous Donor. Your receipt still uses your real
                        name.
                      </span>
                    </span>
                  </label>
                  <div>
                    <label htmlFor="checkout-note" className="mb-2 block text-sm font-medium">
                      Leave a message (optional)
                    </label>
                    <textarea
                      id="checkout-note"
                      className="public-input min-h-24 resize-y"
                      maxLength={500}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      {...fieldProps("note")}
                    />
                    {fieldError("note")}
                  </div>
                </div>
              </Section>
              {recurring && user && (
                <Section number={5} title="How should recurring giving work?">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(["AUTO", "PLEDGE"] as const).map((value) => (
                      <button
                        type="button"
                        disabled={Boolean(gift)}
                        key={value}
                        className="checkout-choice text-left"
                        aria-pressed={mode === value}
                        onClick={() => {
                          setMode(value);
                          setConsent(false);
                          if (value === "AUTO") setMethod("CARD");
                        }}
                      >
                        <span className="block font-semibold">
                          {value === "AUTO" ? "Automatic card charge" : "Reminder-based pledge"}
                        </span>
                        <span className="mt-2 block text-xs leading-5 text-[#686479]">
                          {value === "AUTO"
                            ? "Use a reusable card authorization to give on schedule."
                            : "Receive reminders and choose when to pay. No automatic debit."}
                        </span>
                      </button>
                    ))}
                  </div>
                  {automatic && !gift && (
                    <div className="mt-5">
                      <label className="flex items-start gap-3 text-sm leading-6">
                        <input
                          id="checkout-consent"
                          type="checkbox"
                          checked={consent}
                          onChange={(event) => setConsent(event.target.checked)}
                          className="mt-1.5"
                          {...fieldProps("consent")}
                        />
                        <span>
                          I authorize automatic {frequency} card charges of{" "}
                          {formatMoney(displayedAmount)} plus the applicable platform fee for this
                          campaign. I can pause or cancel in My Giving.
                        </span>
                      </label>
                      {fieldError("consent")}
                    </div>
                  )}
                </Section>
              )}
              <Section number={recurring && user ? 6 : 5} title="Payment method">
                <div className="grid grid-cols-2 gap-3">
                  {(["CARD", "BANK"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      disabled={automatic && value === "BANK"}
                      className="checkout-choice flex items-center gap-2"
                      aria-pressed={(automatic ? "CARD" : method) === value}
                      onClick={() => {
                        setMethod(value);
                        setSavedCard("");
                        setSavedCardConsent(false);
                      }}
                    >
                      {value === "CARD" ? <CreditCard size={17} /> : <Building2 size={17} />}
                      {value === "CARD" ? "Card" : "Bank transfer"}
                    </button>
                  ))}
                </div>
                {!recurring && user && (
                  <div className="mt-5 space-y-3">
                    {cards.isError ? (
                      <p role="alert" className="text-xs text-red-700">
                        Saved cards could not load.{" "}
                        <button
                          type="button"
                          className="underline"
                          onClick={() => void cards.refetch()}
                        >
                          Retry
                        </button>{" "}
                        or use a new card.
                      </p>
                    ) : cards.data?.length ? (
                      <>
                        <label className="giving-label">
                          Saved card
                          <select
                            aria-label="Saved card"
                            className="public-input"
                            value={savedCard}
                            onChange={(event) => {
                              setSavedCard(event.target.value);
                              setSavedCardConsent(false);
                              setMethod("CARD");
                            }}
                          >
                            <option value="">Use a new card on Paystack</option>
                            {cards.data
                              .filter(
                                (card) =>
                                  card.active &&
                                  !card.deactivatedAt &&
                                  card.reusable &&
                                  card.channel === "card",
                              )
                              .map((card) => (
                                <option value={card.id} key={card.id}>
                                  {card.cardType || card.brand || "Card"} ending {card.last4}
                                  {card.isPreferred ? " · Preferred" : ""}
                                </option>
                              ))}
                          </select>
                        </label>
                        {savedCard && (
                          <label className="flex items-start gap-3 text-sm leading-6">
                            <input
                              id="saved-card-consent"
                              type="checkbox"
                              checked={validSavedCardConsent}
                              onChange={(event) => {
                                setSavedCardConsent(event.target.checked);
                                setConsentedTotal(event.target.checked ? totals.total : null);
                              }}
                              className="mt-1.5"
                            />
                            <span>
                              I authorize a one-time charge of {formatMoney(totals.total)} to this
                              saved card, including the displayed fee and tip. No recurring gift is
                              created.
                            </span>
                          </label>
                        )}
                        {submitted && savedCard && !validSavedCardConsent && (
                          <p role="alert" className="text-xs text-red-700">
                            Confirm the one-time saved-card charge to continue.
                          </p>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
                <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#686479]">
                  <LockKeyhole size={14} className="mt-0.5 shrink-0" />
                  {savedCard && !recurring
                    ? "Your saved authorization remains on the server. Payment is only confirmed after Paystack verification."
                    : automatic
                      ? "Automatic giving requires a reusable card. Your card details are entered securely on Paystack, not stored here."
                      : "You will complete payment securely on Paystack. Available methods depend on the payment provider."}
                </p>
              </Section>
            </fieldset>
            {payment.error && (
              <div
                className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                role="alert"
              >
                {payment.error.message}{" "}
                {attempt.current
                  ? "Retry this same payment attempt to check its result before starting a different gift."
                  : "You can retry when you're ready."}
              </div>
            )}
          </form>
        </div>
        <aside
          className="checkout-summary min-w-0 self-start rounded-2xl border border-[#eeeaf2] bg-[#f7f6fa] p-5 sm:p-7 lg:sticky lg:top-6"
          aria-label="Giving summary"
        >
          <h2 className="mb-6 text-lg font-semibold">Your giving summary</h2>
          <div className="mb-6 flex items-center gap-3">
            {campaign.cover && (
              <img
                src={campaign.cover}
                alt=""
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs text-[#686479]">You're supporting</p>
              <p className="mt-1 break-words text-sm font-semibold leading-5">{campaign.title}</p>
            </div>
          </div>
          <dl className="space-y-4 border-y border-[#e4e1e9] py-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt>Donation</dt>
              <dd>{formatMoney(displayedAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Platform fee ({context.platformFeePercent}%)</dt>
              <dd>{formatMoney(totals.platformFee)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>AzarFaith tip</dt>
              <dd>{formatMoney(displayedTip)}</dd>
            </div>
          </dl>
          <div className="my-5 flex items-baseline justify-between gap-4 font-semibold">
            <span>Total today</span>
            <span className="min-w-0 break-all text-right text-2xl">
              {formatMoney(totals.total)}
            </span>
          </div>
          <p className="mb-6 text-xs leading-5 text-[#686479]">
            {recurring
              ? `${frequencyNames[frequency] ?? "Recurring"} giving. ${mode === "PLEDGE" ? "You will be reminded, not automatically charged." : "Future charges use your gift amount plus the applicable platform fee."}`
              : "A one-time gift. No recurring charges."}
          </p>
          <button
            type="submit"
            form="donation-checkout"
            disabled={busy}
            className="public-button checkout-desktop-pay w-full"
          >
            {context.givingPaused
              ? "Giving paused"
              : busy
                ? "Opening Paystack..."
                : `Give ${formatMoney(totals.total)}`}
          </button>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-[#686479]">
            <Heart size={13} />
            Secure payment powered by Paystack
          </p>
        </aside>
        <div className="checkout-mobile-pay fixed inset-x-0 bottom-0 z-40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-[#e4e1e9] bg-white px-5 pt-4 pb-[max(16px,env(safe-area-inset-bottom))] lg:hidden">
          <div className="min-w-0">
            <p className="text-xs text-[#686479]">Total today</p>
            <p className="break-all text-lg font-semibold sm:text-xl">
              {formatMoney(totals.total)}
            </p>
          </div>
          <button type="submit" form="donation-checkout" disabled={busy} className="public-button">
            {context.givingPaused ? "Giving paused" : busy ? "Opening..." : "Give now"}
          </button>
        </div>
      </main>
    </>
  );
}
