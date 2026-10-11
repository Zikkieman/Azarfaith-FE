import { Link } from "@tanstack/react-router";
import { Check, CircleAlert, Clock3, Printer, RefreshCw } from "lucide-react";
import type { DonationVerification } from "@/lib/checkout";
import { formatMoney } from "@/lib/catalog";
import { PageSpinner } from "@/components/PageSpinner";

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
      <main className="mx-auto max-w-xl px-5 py-14 text-center">
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-[#fff3df] text-[#b26416]">
          {error ? <CircleAlert /> : <Clock3 />}
        </div>
        <h1 className="text-2xl font-semibold">
          {error ? "We couldn't confirm your payment" : "Your payment is being processed"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#686479]" role="status">
          {error?.message ?? result?.message}
        </p>
        <p className="mt-3 text-sm text-[#686479]">
          If you have been debited, do not pay again. Check this payment's status or contact
          support.
        </p>
        <button onClick={retry} disabled={loading} className="public-button mt-6 gap-2">
          <RefreshCw size={16} />
          {loading ? "Checking..." : "Check payment status"}
        </button>
        <Link to="/campaign/$id" params={{ id }} className="mt-5 block text-sm underline">
          Back to campaign
        </Link>
      </main>
    );
  const rows = [
    ["Donor", result.donorName],
    ["Campaign", result.campaignTitle],
    ["Donation", formatMoney(result.amount)],
    ["Platform fee", formatMoney(result.platformFee)],
    ["AzarFaith tip", formatMoney(result.tipAmount)],
    ["Total paid", formatMoney(result.totalCharged)],
    ["Payment method", result.paymentMethod === "BANK" ? "Bank transfer" : "Card"],
    ...(result.paidAt ? [["Date", new Date(result.paidAt).toLocaleString()]] : []),
    ...(result.reference ? [["Reference", result.reference]] : []),
  ];
  return (
    <main className="checkout-receipt mx-auto max-w-xl px-5 py-10 sm:py-14">
      <div className="text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-[#eaf6eb] text-[#267044]">
          <Check />
        </div>
        <h1 className="text-3xl font-semibold">Thank you for giving</h1>
        <p className="mt-3 text-sm text-[#686479]">
          Your gift of {formatMoney(result.amount)} has been confirmed.
        </p>
      </div>
      <section className="public-panel mt-8 p-6" aria-label="Donation receipt">
        <h2 className="mb-5 font-semibold">Your donation receipt</h2>
        <dl className="space-y-4">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="grid grid-cols-[100px_minmax(0,1fr)] gap-4 text-sm sm:grid-cols-[140px_minmax(0,1fr)]"
            >
              <dt className="text-[#686479]">{label}</dt>
              <dd className="break-words text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      {result.frequency && (
        <section className="public-panel mt-4 p-5 text-sm leading-6" role="status">
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
      <div className="checkout-receipt-actions mt-6 flex flex-wrap justify-center gap-3">
        <button
          className="public-button public-button-outline gap-2"
          onClick={() => window.print()}
        >
          <Printer size={16} />
          Print receipt
        </button>
        {signedIn && (
          <Link to="/my-giving" className="public-button">
            My Giving
          </Link>
        )}
        <Link to="/campaign/$id" params={{ id }} className="public-button public-button-outline">
          Back to campaign
        </Link>
      </div>
    </main>
  );
}
