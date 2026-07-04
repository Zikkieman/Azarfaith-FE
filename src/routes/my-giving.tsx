import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CreditCard, Repeat2, X } from "lucide-react";
import { toast } from "sonner";

import { Navbar } from "@/components/Navbar";
import { PageSpinner } from "@/components/PageSpinner";
import { Footer } from "@/components/Footer";
import {
  cancelRecurringGift,
  deactivatePaymentMethod,
  getDonationDetail,
  getDonationHistory,
  getPaymentMethods,
  getRecurringGifts,
  updateRecurringGiftPaymentMethod,
} from "@/features/catalog/api";
import { frequencyLabel, formatMoney } from "@/lib/catalog";
import { useRequireAuth } from "@/lib/useRequireAuth";

export const Route = createFileRoute("/my-giving")({ component: MyGiving });

function MyGiving() {
  const isAuthed = useRequireAuth();
  const queryClient = useQueryClient();
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const { data: recurringDonations = [], isLoading } = useQuery({
    queryKey: ["recurring-gifts"],
    queryFn: getRecurringGifts,
    enabled: isAuthed,
  });
  const { data: donations = [], isLoading: donationsLoading } = useQuery({
    queryKey: ["donations"],
    queryFn: getDonationHistory,
    enabled: isAuthed,
  });
  const { data: paymentMethods = [], isLoading: paymentMethodsLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
    enabled: isAuthed,
  });
  const { data: selectedDonation, isLoading: donationDetailLoading } = useQuery({
    queryKey: ["donation-detail", selectedDonationId],
    queryFn: () => getDonationDetail(selectedDonationId!),
    enabled: isAuthed && Boolean(selectedDonationId),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelRecurringGift(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["recurring-gifts"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updatePaymentMethodMutation = useMutation({
    mutationFn: ({ giftId, authorizationId }: { giftId: string; authorizationId: string }) =>
      updateRecurringGiftPaymentMethod(giftId, {
        authorizationId,
        consentToAutoCharge: true,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["recurring-gifts"] });
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deactivatePaymentMethodMutation = useMutation({
    mutationFn: (id: string) => deactivatePaymentMethod(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-gifts"] });
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const active = recurringDonations.filter((gift) => gift.active);
  const cancelled = recurringDonations.filter((gift) => !gift.active);
  const activePaymentMethods = paymentMethods.filter((method) => method.active && method.reusable);
  const filteredDonations = useMemo(() => {
    return donations.filter((donation) => {
      const matchesSearch =
        !search.trim() ||
        donation.campaignTitle.toLowerCase().includes(search.trim().toLowerCase()) ||
        donation.organizationName?.toLowerCase().includes(search.trim().toLowerCase()) ||
        donation.reference.toLowerCase().includes(search.trim().toLowerCase());
      const matchesStatus =
        statusFilter === "all" || donation.status === statusFilter;
      const matchesMode =
        modeFilter === "all" ||
        (modeFilter === "one_time" && !donation.recurringMode) ||
        donation.recurringMode === modeFilter;

      return matchesSearch && matchesStatus && matchesMode;
    });
  }, [donations, modeFilter, search, statusFilter]);

  if (!isAuthed) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto flex-1 w-full max-w-3xl px-5 py-12 md:px-8">
          <PageSpinner label="Redirecting to login..." />
        </main>
        <Footer />
      </div>
    );
  }

  const printReceipt = () => {
    if (!selectedDonation) return;

    const receiptWindow = window.open("", "_blank", "width=900,height=700");
    if (!receiptWindow) {
      toast.error("Allow pop-ups to print the receipt.");
      return;
    }

    receiptWindow.document.write(`
      <html>
        <head>
          <title>AzarFaith Donation Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #1f2937; }
            h1 { margin-bottom: 8px; }
            .muted { color: #6b7280; margin-bottom: 24px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .row { margin-bottom: 14px; }
            .label { font-size: 12px; text-transform: uppercase; color: #b45309; margin-bottom: 4px; }
            .value { font-size: 15px; }
          </style>
        </head>
        <body>
          <h1>AzarFaith Donation Receipt</h1>
          <p class="muted">Reference: ${selectedDonation.receipt.transactionReference}</p>
          <div class="grid">
            <div class="row"><div class="label">Campaign</div><div class="value">${selectedDonation.campaignTitle}</div></div>
            <div class="row"><div class="label">Organization</div><div class="value">${selectedDonation.organizationName ?? "Independent campaign"}</div></div>
            <div class="row"><div class="label">Donor name</div><div class="value">${selectedDonation.receipt.donorName}</div></div>
            <div class="row"><div class="label">Public display</div><div class="value">${selectedDonation.donorDisplayName}</div></div>
            <div class="row"><div class="label">Donation amount</div><div class="value">${formatMoney(selectedDonation.amount)}</div></div>
            <div class="row"><div class="label">Platform fee</div><div class="value">${formatMoney(selectedDonation.platformFee)}</div></div>
            <div class="row"><div class="label">Tip to AzarFaith</div><div class="value">${formatMoney(selectedDonation.tipAmount)}</div></div>
            <div class="row"><div class="label">Total charged</div><div class="value">${formatMoney(selectedDonation.totalCharged)}</div></div>
            <div class="row"><div class="label">Payment method</div><div class="value">${selectedDonation.paymentMethod}</div></div>
            <div class="row"><div class="label">Date</div><div class="value">${selectedDonation.receipt.date}</div></div>
          </div>
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  };

  const downloadReceipt = () => {
    if (!selectedDonation) return;

    const html = `
      <html><body>
      <h1>AzarFaith Donation Receipt</h1>
      <p>Reference: ${selectedDonation.receipt.transactionReference}</p>
      <p>Campaign: ${selectedDonation.campaignTitle}</p>
      <p>Organization: ${selectedDonation.organizationName ?? "Independent campaign"}</p>
      <p>Donor: ${selectedDonation.receipt.donorName}</p>
      <p>Total charged: ${formatMoney(selectedDonation.totalCharged)}</p>
      </body></html>
    `;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `azarfaith-receipt-${selectedDonation.id}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const header = [
      "Date",
      "Campaign",
      "Organization",
      "Amount",
      "Platform Fee",
      "Tip",
      "Total Charged",
      "Status",
      "Recurring Mode",
      "Reference",
    ];
    const rows = filteredDonations.map((donation) => [
      donation.createdAt.slice(0, 10),
      donation.campaignTitle,
      donation.organizationName ?? "",
      donation.amount.toString(),
      donation.platformFee.toString(),
      donation.tipAmount.toString(),
      donation.totalCharged.toString(),
      donation.status,
      donation.recurringMode ?? "one_time",
      donation.reference,
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "azarfaith-donation-history.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-3xl px-5 py-12 md:px-8">
        <h1 className="font-display text-3xl tracking-tight">My giving</h1>
        <p className="mt-2 text-muted-foreground">Your recurring support, in one place.</p>

        <section className="mt-8 rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
              Saved payment methods
            </h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Automatic recurring gifts use a reusable Paystack authorization saved after a successful first donation.
          </p>

          <div className="mt-4 space-y-3">
            {paymentMethodsLoading ? (
              <PageSpinner label="Loading saved payment methods..." fullScreen={false} />
            ) : activePaymentMethods.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                No reusable payment method has been saved yet. Complete the first automatic recurring donation with Paystack and it will appear here.
              </div>
            ) : (
              activePaymentMethods.map((method) => (
                <div key={method.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border p-4">
                  <div>
                    <p className="text-sm font-medium">{method.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {method.email}
                      {method.expMonth && method.expYear
                        ? ` · expires ${method.expMonth}/${method.expYear}`
                        : ""}
                    </p>
                    {method.linkedRecurringGiftCount > 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Linked to {method.linkedRecurringGiftCount} recurring gift
                        {method.linkedRecurringGiftCount > 1 ? "s" : ""}.
                      </p>
                    ) : null}
                  </div>
                  <button
                    onClick={() => deactivatePaymentMethodMutation.mutate(method.id)}
                    disabled={
                      deactivatePaymentMethodMutation.isPending || method.linkedRecurringGiftCount > 0
                    }
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="mt-8 space-y-4">
          {isLoading ? (
            <PageSpinner label="Loading recurring gifts..." fullScreen={false} />
          ) : active.length === 0 ? (
            <p className="text-sm text-muted-foreground">You don't have any active recurring gifts yet.</p>
          ) : (
            active.map((gift) => (
              <div key={gift.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                <img src={gift.targetCover} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{gift.targetName}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${gift.status === "on_track" ? "bg-emerald-50 text-emerald-700" : gift.status === "missed" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                      {gift.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Repeat2 className="h-3 w-3" /> {formatMoney(gift.amount)} · {frequencyLabel[gift.frequency]} · {gift.mode === "auto" ? "Automatic" : "Reminder"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Next scheduled date: {gift.nextDate}</p>
                  {gift.nextReminderDate ? <p className="mt-0.5 text-xs text-muted-foreground">Next reminder: {gift.nextReminderDate}</p> : null}
                  {gift.mode === "auto" ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Auto-charge consent: {gift.autoChargeConsentAt ? "Recorded" : "Not recorded"}
                    </p>
                  ) : null}
                  {gift.mode === "auto" ? (
                    activePaymentMethods.length > 0 ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <label className="text-xs text-muted-foreground">Saved payment method</label>
                        <select
                          value={gift.authorizationId ?? ""}
                          onChange={(event) => {
                            if (!event.target.value) return;
                            updatePaymentMethodMutation.mutate({
                              giftId: gift.id,
                              authorizationId: event.target.value,
                            });
                          }}
                          className="rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                          disabled={updatePaymentMethodMutation.isPending}
                        >
                          <option value="">Select a saved payment method</option>
                          {activePaymentMethods.map((method) => (
                            <option key={method.id} value={method.id}>
                              {method.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-amber-700">
                        No reusable saved payment method is linked yet.
                      </p>
                    )
                  ) : null}
                  {gift.missedCount > 0 ? <p className="mt-0.5 text-xs text-amber-700">Missed pledges: {gift.missedCount}</p> : null}
                  {gift.retryCount > 0 ? <p className="mt-0.5 text-xs text-amber-700">Retry attempts tracked: {gift.retryCount}</p> : null}
                </div>
                <button
                  onClick={() => cancelMutation.mutate(gift.id)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition hover:bg-muted"
                  aria-label="Cancel recurring gift"
                  disabled={cancelMutation.isPending}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ))
          )}
        </div>

        <section className="mt-10 rounded-3xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
            Donation history
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            View receipt details for every gift completed through AzarFaith.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search campaign, org, or reference"
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 md:col-span-2"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="all">All statuses</option>
              <option value="succeeded">Succeeded</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={modeFilter}
              onChange={(event) => setModeFilter(event.target.value)}
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="all">All gift types</option>
              <option value="one_time">One-time</option>
              <option value="auto">Automatic</option>
              <option value="pledge">Pledge</option>
            </select>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            <span>{filteredDonations.length} donation{filteredDonations.length === 1 ? "" : "s"} in view</span>
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-background"
            >
              Export filtered CSV
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {donationsLoading ? (
              <PageSpinner label="Loading donation history..." fullScreen={false} />
            ) : filteredDonations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                No donations match the current filters.
              </div>
            ) : (
              filteredDonations.map((donation) => (
                <button
                  key={donation.id}
                  onClick={() =>
                    setSelectedDonationId((current) =>
                      current === donation.id ? null : donation.id,
                    )
                  }
                  className="flex w-full items-start justify-between gap-3 rounded-2xl border border-border p-4 text-left transition hover:border-amber-300"
                >
                  <div>
                    <p className="text-sm font-medium">{donation.campaignTitle}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {donation.createdAt.slice(0, 10)} · {donation.status.replaceAll("_", " ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatMoney(donation.totalCharged)}</p>
                    <p className="mt-1 text-xs text-amber-700">View receipt</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {selectedDonationId ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              {donationDetailLoading || !selectedDonation ? (
                <PageSpinner label="Loading receipt..." fullScreen={false} />
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-amber-900">Donation receipt</h3>
                    <span className="text-xs text-amber-800">
                      {selectedDonation.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <ReceiptRow label="Campaign" value={selectedDonation.campaignTitle} />
                    <ReceiptRow
                      label="Organization"
                      value={selectedDonation.organizationName ?? "Independent campaign"}
                    />
                    <ReceiptRow label="Donor name" value={selectedDonation.receipt.donorName} />
                    <ReceiptRow
                      label="Public display"
                      value={selectedDonation.donorDisplayName}
                    />
                    <ReceiptRow
                      label="Donation amount"
                      value={formatMoney(selectedDonation.amount)}
                    />
                    <ReceiptRow
                      label="Platform fee"
                      value={formatMoney(selectedDonation.platformFee)}
                    />
                    <ReceiptRow
                      label="Tip to AzarFaith"
                      value={formatMoney(selectedDonation.tipAmount)}
                    />
                    <ReceiptRow
                      label="Total charged"
                      value={formatMoney(selectedDonation.totalCharged)}
                    />
                    <ReceiptRow
                      label="Reference"
                      value={selectedDonation.receipt.transactionReference}
                    />
                    <ReceiptRow label="Payment method" value={selectedDonation.paymentMethod} />
                  </div>
                  {selectedDonation.note ? (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-700">
                        Note
                      </p>
                      <p className="mt-1 text-sm text-amber-950">{selectedDonation.note}</p>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={printReceipt}
                      className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-600"
                    >
                      Print receipt
                    </button>
                    <button
                      type="button"
                      onClick={downloadReceipt}
                      className="rounded-full border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                    >
                      Download receipt
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </section>

        {cancelled.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-medium text-muted-foreground">Cancelled</h2>
            <div className="mt-3 space-y-3">
              {cancelled.map((gift) => (
                <div key={gift.id} className="flex items-center gap-4 rounded-2xl border border-border p-4 opacity-60">
                  <img src={gift.targetCover} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{gift.targetName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatMoney(gift.amount)} · {frequencyLabel[gift.frequency]} · Cancelled</p>
                    {gift.cancellationReason ? <p className="mt-0.5 text-xs text-muted-foreground">{gift.cancellationReason}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link to="/discover" className="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 transition hover:text-amber-700">
          Discover more causes to support
        </Link>
      </main>
      <Footer />
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-700">{label}</p>
      <p className="mt-1 text-sm text-amber-950">{value}</p>
    </div>
  );
}
