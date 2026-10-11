import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Download, Receipt, Search } from "lucide-react";
import { toast } from "sonner";
import { getDonationDetail } from "@/features/catalog/api";
import { PageSpinner } from "@/components/PageSpinner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { DonationHistoryItem } from "@/lib/catalog";
import {
  donationDate,
  downloadGivingFile,
  filterGiving,
  frequencyLabels,
  givingCsv,
  givingDate,
  money,
  receiptHtml,
  type GivingFilters,
} from "@/lib/giving";

const initialFilters: GivingFilters = { search: "", status: "", kind: "", from: "", to: "" };
export function GivingHistory({
  donations,
  userId,
}: {
  donations: DonationHistoryItem[];
  userId: string;
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = filterGiving(donations, filters);
  const shown = filtered.slice((page - 1) * 15, page * 15);
  const invalidRange = Boolean(filters.from && filters.to && filters.from > filters.to);
  function update(key: keyof GivingFilters, value: string) {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm leading-relaxed text-[#777283]">
          All payments, including recurring gifts. Only successful donations count toward your
          giving totals. Amounts below exclude platform fees and tips.
        </p>
        <button
          type="button"
          className="dashboard-button secondary"
          disabled={filtered.length === 0 || invalidRange}
          onClick={() =>
            downloadGivingFile(
              givingCsv(filtered),
              `azarfaith-giving-${new Date().toISOString().slice(0, 10)}.csv`,
              "text/csv;charset=utf-8",
            )
          }
        >
          <Download size={15} /> Export filtered CSV
        </button>
      </div>
      <section
        aria-label="Filter donation history"
        className="dashboard-panel grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <label className="min-w-0">
          <span className="giving-label">Search</span>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-[#777283]" size={15} />
            <input
              className="giving-input !pl-9"
              value={filters.search}
              onChange={(event) => update("search", event.target.value)}
              placeholder="Campaign or reference"
            />
          </div>
        </label>
        <label>
          <span className="giving-label">Payment status</span>
          <select
            className="giving-input"
            value={filters.status}
            onChange={(event) => update("status", event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="succeeded">Successful</option>
            <option value="pending">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <label>
          <span className="giving-label">Gift type</span>
          <select
            className="giving-input"
            value={filters.kind}
            onChange={(event) => update("kind", event.target.value)}
          >
            <option value="">All gifts</option>
            <option value="once">One-time</option>
            <option value="recurring">Recurring</option>
          </select>
        </label>
        <label className="min-w-0">
          <span className="giving-label">From (UTC)</span>
          <input
            className="giving-input"
            type="date"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(event) => update("from", event.target.value)}
          />
        </label>
        <label className="min-w-0">
          <span className="giving-label">To (UTC)</span>
          <input
            className="giving-input"
            type="date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(event) => update("to", event.target.value)}
          />
        </label>
      </section>
      {invalidRange && (
        <p role="alert" className="text-sm text-red-700">
          The end date must be on or after the start date.
        </p>
      )}
      <div className="flex items-center justify-between gap-3 text-xs text-[#777283]">
        <p>
          {filtered.length} matching payment{filtered.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          className="underline underline-offset-4"
          onClick={() => {
            setFilters(initialFilters);
            setPage(1);
          }}
        >
          Clear filters
        </button>
      </div>
      {shown.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-[#eeedf1]">
          <table className="w-full min-w-[660px] text-left text-sm">
            <caption className="sr-only">Your donation history</caption>
            <thead className="bg-[#faf9fc] text-xs text-[#777283]">
              <tr>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Gift to</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 text-right font-medium">Gift amount</th>
                <th className="p-4 font-medium">Receipt / details</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((donation) => (
                <tr key={donation.id} className="border-t border-[#eeedf1]">
                  <td className="whitespace-nowrap p-4 text-[#615970]">
                    {givingDate(donationDate(donation))}
                  </td>
                  <td className="max-w-[300px] p-4">
                    <Link
                      to="/campaign/$id"
                      params={{ id: donation.campaignId }}
                      className="font-medium hover:underline"
                    >
                      {donation.campaignTitle}
                    </Link>
                    <p className="mt-1 text-xs text-[#777283]">
                      {donation.organizationName ?? "Independent campaign"}
                    </p>
                  </td>
                  <td className="p-4 text-[#615970]">
                    {donation.frequency ? frequencyLabels[donation.frequency] : "One-time"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${donation.status === "succeeded" ? "bg-emerald-50 text-emerald-800" : donation.status === "failed" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"}`}
                    >
                      {donation.status === "succeeded"
                        ? "Successful"
                        : donation.status === "pending"
                          ? "Processing"
                          : donation.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap p-4 text-right font-medium tabular-nums">
                    {money(donation.amount)}
                  </td>
                  <td className="p-4">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-4"
                      onClick={() => setSelectedId(donation.id)}
                    >
                      <Receipt size={14} />
                      {donation.status === "succeeded" ? "View receipt" : "View details"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dashboard-panel p-8 text-center text-sm text-[#777283]">
          {donations.length === 0
            ? "Your giving history will appear here after your first donation."
            : "No payments match these filters."}
        </div>
      )}
      {filtered.length > 15 && (
        <nav aria-label="Donation history pages" className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="giving-small-button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span className="text-xs text-[#777283]">
            Page {page} of {Math.ceil(filtered.length / 15)}
          </span>
          <button
            type="button"
            className="giving-small-button"
            disabled={page * 15 >= filtered.length}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </nav>
      )}
      {selectedId && (
        <ReceiptDialog id={selectedId} userId={userId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

function ReceiptDialog({
  id,
  userId,
  onClose,
}: {
  id: string;
  userId: string;
  onClose: () => void;
}) {
  const detail = useQuery({
    queryKey: ["donation-detail", userId, id],
    queryFn: () => getDonationDetail(id),
    retry: false,
  });
  const donation = detail.data;
  function print() {
    if (!donation) return;
    const popup = window.open("", "_blank");
    if (!popup) {
      toast.error("Allow pop-ups to print your receipt.");
      return;
    }
    popup.opener = null;
    popup.document.write(receiptHtml(donation));
    popup.document.close();
    popup.focus();
    popup.print();
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] w-[calc(100%-32px)] overflow-y-auto rounded-2xl bg-white text-[#130e30] sm:max-w-[580px]">
        <DialogTitle>
          {donation?.status === "succeeded" ? "Donation receipt" : "Payment details"}
        </DialogTitle>
        <DialogDescription>Your transaction record from AzarFaith.</DialogDescription>
        {detail.isPending ? (
          <PageSpinner label="Loading your receipt..." fullScreen={false} />
        ) : detail.error ? (
          <div role="alert">
            <p className="text-sm text-red-700">{detail.error.message}</p>
            <button
              type="button"
              className="dashboard-button secondary mt-3"
              onClick={() => detail.refetch()}
            >
              Try again
            </button>
          </div>
        ) : donation ? (
          <>
            <dl className="divide-y divide-[#eeedf1]">
              {[
                ["Donor", donation.receipt.donorName],
                ["Campaign", donation.campaignTitle],
                ["Organization", donation.organizationName ?? "Independent campaign"],
                ["Date (UTC)", givingDate(donation.paidAt ?? donation.createdAt)],
                ["Status", donation.status],
                ["Gift amount", money(donation.amount)],
                ["Platform fee", money(donation.platformFee)],
                ["Tip to AzarFaith", money(donation.tipAmount)],
                ["Total charged", money(donation.totalCharged)],
                ["Reference", donation.reference],
                ["Public name", donation.donorDisplayName],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[100px_minmax(0,1fr)] gap-4 py-3 text-sm"
                >
                  <dt className="text-[#777283]">{label}</dt>
                  <dd className="break-words font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            {donation.failureMessage && (
              <p className="text-sm text-red-700">{donation.failureMessage}</p>
            )}
            {donation.status === "succeeded" ? (
              <div className="flex flex-wrap gap-2">
                <button type="button" className="dashboard-button" onClick={print}>
                  Print / save PDF
                </button>
                <button
                  type="button"
                  className="dashboard-button secondary"
                  onClick={() =>
                    downloadGivingFile(
                      receiptHtml(donation),
                      `azarfaith-receipt-${donation.id.replace(/[^a-zA-Z0-9-]/g, "")}.html`,
                      "text/html;charset=utf-8",
                    )
                  }
                >
                  Download HTML receipt
                </button>
              </div>
            ) : (
              <p className="text-xs text-[#777283]">
                A receipt is available only after payment is confirmed successful.
              </p>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
