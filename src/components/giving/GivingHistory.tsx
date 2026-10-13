import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Download, CalendarClock, Repeat2, Search } from "lucide-react";
import { toast } from "sonner";
import { getDonationDetail } from "@/features/catalog/api";
import { PageSpinner } from "@/components/PageSpinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/app/DesignDialog";
import type { DonationDetail, DonationHistoryItem } from "@/lib/catalog";
import { formatMoney } from "@/lib/catalog";
import {
  donationDate,
  downloadGivingFile,
  filterGiving,
  frequencyLabels,
  givingCsv,
  givingDate,
  money,
  receiptHtml,
  receiptsHtml,
  type GivingFilters,
} from "@/lib/giving";

import { btn } from "@/components/app/btn";
import { inputClass, labelClass } from "@/components/app/AppShell";
import { cn } from "@/lib/utils";

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

  const [downloading, setDownloading] = useState(false);
  const downloadingRef = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const eligible = filtered.filter((donation) => donation.status === "succeeded");
  async function downloadAll() {
    if (downloadingRef.current || invalidRange || !eligible.length) return;
    downloadingRef.current = true;
    setDownloading(true);
    try {
      const receipts: DonationDetail[] = [];
      for (let i = 0; i < eligible.length; i += 4) {
        if (!mounted.current) return;
        const chunk = eligible.slice(i, i + 4);
        const details = await Promise.all(chunk.map((donation) => getDonationDetail(donation.id)));
        if (
          details.some(
            (detail, index) => detail.id !== chunk[index].id || detail.status !== "succeeded",
          )
        )
          throw new Error("A selected receipt is unavailable. Refresh your history and try again.");
        receipts.push(...details);
      }
      if (mounted.current)
        downloadGivingFile(
          receiptsHtml(receipts),
          "azarfaith-receipts.html",
          "text/html;charset=utf-8",
        );
    } catch (error) {
      if (mounted.current)
        toast.error(error instanceof Error ? error.message : "Could not download receipts.");
    } finally {
      downloadingRef.current = false;
      if (mounted.current) setDownloading(false);
    }
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-ink-soft">
          Keep receipts for your church and charity giving records.
        </p>
        <button
          type="button"
          disabled={downloading || !eligible.length || invalidRange}
          className={btn("secondary", "sm")}
          onClick={() => void downloadAll()}
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
          {downloading ? "Downloading..." : "All receipts"}
        </button>
      </div>
      <details className="rounded-field border border-line-soft p-4">
        <summary className="cursor-pointer text-sm font-medium text-ink">
          Filter history and export
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          <section
            aria-label="Filter donation history"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            <label className="min-w-0">
              <span className={labelClass}>Search</span>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-muted-ink" size={15} />
                <input
                  className={cn(inputClass, "pl-9")}
                  value={filters.search}
                  onChange={(event) => update("search", event.target.value)}
                  placeholder="Campaign or reference"
                />
              </div>
            </label>
            <label>
              <span id="history-status-label" className={labelClass}>
                Payment status
              </span>
              <select
                aria-labelledby="history-status-label"
                className={inputClass}
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
              <span id="history-kind-label" className={labelClass}>
                Gift type
              </span>
              <select
                aria-labelledby="history-kind-label"
                className={inputClass}
                value={filters.kind}
                onChange={(event) => update("kind", event.target.value)}
              >
                <option value="">All gifts</option>
                <option value="once">One-time</option>
                <option value="recurring">Recurring</option>
              </select>
            </label>
            <label className="min-w-0">
              <span className={labelClass}>From (UTC)</span>
              <input
                className={inputClass}
                type="date"
                value={filters.from}
                max={filters.to || undefined}
                onChange={(event) => update("from", event.target.value)}
              />
            </label>
            <label className="min-w-0">
              <span className={labelClass}>To (UTC)</span>
              <input
                className={inputClass}
                type="date"
                value={filters.to}
                min={filters.from || undefined}
                onChange={(event) => update("to", event.target.value)}
              />
            </label>
          </section>
          {invalidRange && (
            <p role="alert" className="text-[13px] text-danger">
              The end date must be on or after the start date.
            </p>
          )}
          <div className="flex items-center justify-between gap-3 text-xs text-muted-ink">
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

          <button
            type="button"
            className={cn(btn("secondary", "sm"), "self-start")}
            disabled={!filtered.length || invalidRange}
            onClick={() =>
              downloadGivingFile(
                givingCsv(filtered),
                "azarfaith-giving-" + new Date().toISOString().slice(0, 10) + ".csv",
                "text/csv;charset=utf-8",
              )
            }
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.75} /> Export filtered CSV
          </button>
        </div>
      </details>
      {shown.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b border-line-soft text-[13px] text-muted-ink">
                <th className="pb-2.5 font-medium">Date</th>
                <th className="pb-2.5 font-medium">Gift to</th>
                <th className="pb-2.5 font-medium">Type</th>
                <th className="pb-2.5 text-right font-medium">Amount</th>
                <th className="w-24 pb-2.5" aria-label="Receipt" />
              </tr>
            </thead>
            <tbody>
              {shown.map((g, i) => (
                <tr
                  key={g.id}
                  className="admin-row border-b border-line-soft"
                  style={{ animationDelay: `${i * 25}ms` }}
                >
                  <td className="whitespace-nowrap py-3.5 text-ink-soft">
                    {givingDate(donationDate(g))}
                  </td>
                  <td className="max-w-[320px] py-3.5">
                    <Link
                      to="/campaign/$id"
                      params={{ id: g.campaignId }}
                      className="line-clamp-1 font-medium text-ink hover:underline"
                    >
                      {g.campaignTitle}
                    </Link>
                  </td>
                  <td className="py-3.5 text-ink-soft">
                    <span className="inline-flex items-center gap-1.5">
                      {!g.frequency ? (
                        <CalendarClock className="h-3.5 w-3.5 text-muted-ink" strokeWidth={1.75} />
                      ) : (
                        <Repeat2 className="h-3.5 w-3.5 text-muted-ink" strokeWidth={1.75} />
                      )}
                      {g.frequency ? frequencyLabels[g.frequency] : "One time"}
                      {g.status !== "succeeded" ? (
                        <span className="text-[12px] text-brand-ink">
                          {g.status === "pending" ? "Processing" : g.status}
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="py-3.5 text-right tabular-nums text-ink">
                    {formatMoney(g.amount)}
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedId(g.id)}
                      className="inline-flex items-center gap-1 text-[13px] text-ink-soft hover:text-ink"
                    >
                      <Download className="h-3.5 w-3.5" strokeWidth={1.75} />{" "}
                      {g.status === "succeeded" ? "Receipt" : "Details"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-card border border-line-soft px-5 py-10 text-center text-sm text-muted-ink">
          {donations.length
            ? "No payments match these filters."
            : "Your giving history will appear here after your first donation."}
        </p>
      )}
      {filtered.length > 15 && (
        <nav aria-label="Donation history pages" className="flex items-center justify-end gap-3">
          <button
            type="button"
            className={btn("secondary", "sm")}
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span className="text-xs text-muted-ink">
            Page {page} of {Math.ceil(filtered.length / 15)}
          </span>
          <button
            type="button"
            className={btn("secondary", "sm")}
            disabled={page * 15 >= filtered.length}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </nav>
      )}

      {selectedId ? (
        <ReceiptDialog id={selectedId} userId={userId} onClose={() => setSelectedId(null)} />
      ) : null}
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
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[580px]">
        <DialogTitle>
          {donation?.status === "succeeded" ? "Donation receipt" : "Payment details"}
        </DialogTitle>
        <DialogDescription>Your transaction record from AzarFaith.</DialogDescription>
        {detail.isPending ? (
          <PageSpinner label="Loading your receipt..." fullScreen={false} />
        ) : detail.error ? (
          <div role="alert">
            <p className="text-sm text-danger">{detail.error.message}</p>
            <button
              type="button"
              className={cn(btn("secondary", "sm"), "mt-3")}
              onClick={() => detail.refetch()}
            >
              Try again
            </button>
          </div>
        ) : donation ? (
          <>
            <dl className="divide-y divide-line-soft">
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
                  <dt className="text-muted-ink">{label}</dt>
                  <dd className="break-words font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            {donation.failureMessage && (
              <p className="text-sm text-danger">{donation.failureMessage}</p>
            )}
            {donation.status === "succeeded" ? (
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btn("primary")} onClick={print}>
                  Print / save PDF
                </button>
                <button
                  type="button"
                  className={btn("secondary")}
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
              <p className="text-xs text-muted-ink">
                A receipt is available only after payment is confirmed successful.
              </p>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
