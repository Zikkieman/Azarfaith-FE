export type CheckoutContext = {
  currency: "NGN";
  platformFeePercent: number;
  minDonation: number;
  maxDonation: number;
  frequencies: Array<"WEEKLY" | "MONTHLY" | "QUARTERLY">;
  recurringGift: {
    id: string;
    amount: number;
    frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY";
    mode: "AUTO" | "PLEDGE";
  } | null;
};

export type DonationVerification =
  | {
      status: "pending";
      donationId: string;
      message: string;
    }
  | {
      status: "success";
      donationId: string;
      message: string;
      reference: string | null;
      campaignTitle: string;
      donorName: string;
      amount: number;
      platformFee: number;
      tipAmount: number;
      totalCharged: number;
      paymentMethod: "CARD" | "BANK";
      paidAt: string | null;
      frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | null;
      recurringMode: "AUTO" | "PLEDGE" | null;
      recurringGiftId: string | null;
      recurringSetupActive: boolean;
      nextDonationDate: string | null;
    };

export function checkoutTotals(amount: number, tip: number, feePercent: number) {
  const platformFee = Math.round((amount * feePercent) / 100);
  return { platformFee, total: amount + platformFee + tip };
}

export function initialGiftAmount(value: string) {
  if (!value) return 5000;
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : 0;
}

export function formatCheckoutInput(value: string) {
  const digits = value.replace(/,/g, "").trim();
  if (!digits) return "";
  return /^\d+$/.test(digits) && Number.isSafeInteger(Number(digits))
    ? Number(digits).toLocaleString()
    : value;
}

export function parseCheckoutInput(value: string) {
  const digits = value.replace(/,/g, "").trim();
  if (!digits) return 0;
  return /^\d+$/.test(digits) ? Number(digits) : NaN;
}

export function validateCheckout(
  input: {
    amount: number;
    tip: number;
    name: string;
    email: string;
    note: string;
    frequency: string;
    mode: "AUTO" | "PLEDGE";
    consent: boolean;
    authenticated: boolean;
  },
  context: CheckoutContext,
) {
  const errors: Record<string, string> = {};
  if (
    !Number.isSafeInteger(input.amount) ||
    input.amount < context.minDonation ||
    input.amount > context.maxDonation
  ) {
    errors.amount = `Enter an amount between ₦${context.minDonation.toLocaleString()} and ₦${context.maxDonation.toLocaleString()}.`;
  }
  if (
    !Number.isSafeInteger(input.tip) ||
    input.tip < 0 ||
    input.tip > 2147483647 ||
    checkoutTotals(input.amount, input.tip, context.platformFeePercent).total > 2147483647
  ) {
    errors.tip = "Enter a valid tip, or reduce it so the total can be processed.";
  }
  if (!input.name.trim() || input.name.trim().length > 120)
    errors.name = "Enter your full name (up to 120 characters).";
  if (input.email.trim().length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()))
    errors.email = "Enter a valid email for your receipt.";
  if (input.note.trim().length > 500) errors.note = "Keep your message within 500 characters.";
  if (input.frequency !== "once") {
    if (!context.frequencies.some((value) => value.toLowerCase() === input.frequency))
      errors.frequency = "Choose a frequency offered by this campaign.";
    if (!input.authenticated)
      errors.frequency = "Log in to set up recurring giving, or choose One-time.";
    if (input.mode === "AUTO" && !input.consent && !context.recurringGift)
      errors.consent = "Please agree to automatic card charging to continue.";
  }
  return errors;
}

export function paystackCheckoutUrl(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "checkout.paystack.com" ||
    url.username ||
    url.password
  ) {
    throw new Error("The payment link could not be confirmed. Please try again.");
  }
  return url.href;
}
