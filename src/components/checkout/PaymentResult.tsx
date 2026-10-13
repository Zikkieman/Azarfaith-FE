import { Link } from "@tanstack/react-router";
import { Check, CircleAlert, Clock3, Printer, RefreshCw, Share2 } from "lucide-react";
import type { DonationVerification } from "@/lib/checkout";
import { formatMoney } from "@/lib/catalog";
import { shareCause } from "@/lib/share-cause";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { btn } from "@/components/app/btn";
import { PageSpinner } from "@/components/PageSpinner";
import { cn } from "@/lib/utils";
import { Row } from "./CheckoutParts";

export function PaymentResult({
  id,
  result,
  error,
  loading,
  retry,
  signedIn,
}: {
  id: string;
  result?: DonationVerification;
  error: Error | null;
  loading: boolean;
  retry: () => void;
  signedIn: boolean;
}) {
  if (!result && loading) return <PageSpinner label="Confirming your payment..." />;
  if (!result || result.status === "pending")
    return (
      <main className="mx-auto max-w-xl px-6 py-14 text-center">
        <Link to="/" aria-label="AzarFaith home">
          <AuthLogo />
        </Link>
        <div className="mx-auto mb-6 mt-8 grid h-14 w-14 place-items-center rounded-full bg-panel text-ink-soft">
          {error ? <CircleAlert /> : <Clock3 />}
        </div>
        <h1 className="font-display text-[26px] text-ink">
          {error ? "We couldn't confirm your payment" : "Your payment is being processed"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-ink" role="status">
          {error?.message ?? result?.message}
        </p>
        <p className="mt-3 text-sm text-muted-ink">
          If you have been debited, do not pay again. Check this payment's status or contact
          support.
        </p>
        <button
          type="button"
          onClick={retry}
          disabled={loading}
          className={cn(btn("primary"), "mt-6")}
        >
          <RefreshCw size={16} />
          {loading ? "Checking..." : "Check payment status"}
        </button>
        <Link to="/campaign/$id" params={{ id }} className="mt-5 block text-sm underline">
          Back to campaign
        </Link>
      </main>
    );
  return (
    <div className="min-h-screen bg-panel px-6 py-10 font-gsf">
      <main className="checkout-receipt mx-auto flex max-w-[480px] flex-col items-center gap-6">
        <Link to="/" aria-label="AzarFaith home">
          <AuthLogo />
        </Link>
        <section
          aria-label="Donation receipt"
          className="admin-rise w-full overflow-hidden rounded-card bg-paper shadow-[0_24px_64px_-24px_rgba(19,14,48,0.25)]"
        >
          <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-verified text-white animate-pop">
              <Check className="h-7 w-7" strokeWidth={2.5} />
            </span>
            <h1 className="font-display text-[26px] leading-tight text-ink">Thank you</h1>
            <p className="text-[15px] text-ink-soft">
              Your gift of {formatMoney(result.amount)} has been confirmed.
            </p>
          </div>
          <div className="border-t border-dashed border-line-input px-6 py-5">
            <dl className="flex flex-col gap-2.5 text-sm">
              <Row label="Receipt" value={result.reference ?? result.donationId} />
              {result.paidAt && (
                <Row label="Date" value={new Date(result.paidAt).toLocaleString("en-NG")} />
              )}
              <Row label="Donor" value={result.donorName} />
              <Row label="For" value={result.campaignTitle} />
              <Row label="Gift" value={formatMoney(result.amount)} />
              <Row label="Platform fee" value={formatMoney(result.platformFee)} />
              {result.tipAmount > 0 && <Row label="Tip" value={formatMoney(result.tipAmount)} />}
              <Row
                label="Paid with"
                value={result.paymentMethod === "BANK" ? "Bank transfer" : "Card"}
              />
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t border-line-soft pt-4">
              <span className="text-[15px] font-medium text-ink">Total</span>
              <span className="font-display text-[24px] text-ink">
                {formatMoney(result.totalCharged)}
              </span>
            </div>
            {result.frequency && (
              <section
                className="mt-3 rounded-field bg-panel px-3.5 py-2.5 text-[13px] text-ink-soft"
                role="status"
              >
                <h2 className="font-semibold">
                  {result.recurringMode === "PLEDGE"
                    ? "Reminder-based pledge"
                    : "Automatic recurring gift"}
                </h2>
                <p>{result.message}</p>
                {result.recurringSetupActive && (
                  <p>
                    Frequency: {result.frequency.toLowerCase()}.{" "}
                    {result.nextDonationDate && (
                      <>
                        Next {result.recurringMode === "PLEDGE" ? "pledge" : "scheduled charge"}:{" "}
                        {new Date(result.nextDonationDate).toLocaleDateString()}.
                      </>
                    )}
                  </p>
                )}
                {result.recurringMode === "PLEDGE" && (
                  <p>No automatic charge. You choose when to complete each reminder.</p>
                )}
              </section>
            )}
          </div>
          <div className="checkout-receipt-actions flex gap-2 border-t border-line-soft px-6 py-4">
            <button
              type="button"
              className={cn(btn("secondary", "sm"), "flex-1")}
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" strokeWidth={1.75} />
              Print receipt
            </button>
            <button
              type="button"
              className={cn(btn("secondary", "sm"), "flex-1")}
              onClick={() => void shareCause("campaign", id, result.campaignTitle, true)}
            >
              <Share2 className="h-4 w-4" strokeWidth={1.75} />
              Share
            </button>
          </div>
        </section>
        <div className="checkout-receipt-actions flex flex-wrap justify-center gap-3">
          <Link to="/campaign/$id" params={{ id }} className={btn("primary")}>
            Back to campaign
          </Link>
          {signedIn ? (
            <Link to="/my-giving" className={btn("secondary")}>
              My Giving
            </Link>
          ) : (
            <Link to="/discover" className={btn("secondary")}>
              Find another cause
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
