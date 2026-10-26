import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { HeartHandshake, RefreshCw } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminLayout";
import { btn } from "@/components/app/btn";
import { apiFetch } from "@/lib/api";
import { formatMoney } from "@/lib/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/platform-donations")({
  head: () => ({ meta: [{ title: "AzarFaith donations — Admin" }] }),
  component: PlatformDonations,
});

type DonationRow = {
  id: string;
  donorName: string;
  receiptEmail: string;
  amount: number;
  note: string | null;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  paystackReference: string;
  createdAt: string;
  paidAt: string | null;
  receiptSentAt: string | null;
};
type Report = {
  items: DonationRow[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  succeededAmount: number;
  succeededCount: number;
  pendingCount: number;
};

function PlatformDonations() {
  const [page, setPage] = useState(1);
  const report = useQuery({ queryKey: ["admin", "platform-donations", page], queryFn: () => apiFetch<Report>(`/admin/review/platform-donations?page=${page}`, { cache: "no-store" }) });
  const data = report.data;
  return (
    <AdminPage
      title="Donations to AzarFaith"
      lead="Direct support for urgent causes and platform operations. These amounts are kept separate from campaign giving."
      crumbs={[{ label: "Overview", to: "/admin" }, { label: "AzarFaith donations" }]}
      actions={<button type="button" onClick={() => { void report.refetch(); }} disabled={report.isFetching} className={btn("secondary", "sm")}><RefreshCw className={cn("h-4 w-4", report.isFetching && "animate-spin")} /> Refresh</button>}
    >
      {report.error ? <p role="alert" className="rounded-card border border-danger/20 bg-danger/5 p-5 text-sm text-danger">Could not load AzarFaith donations. Try refreshing.</p> : null}
      <dl className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Confirmed support", value: formatMoney(data?.succeededAmount ?? 0) },
          { label: "Confirmed donations", value: String(data?.succeededCount ?? 0) },
          { label: "Awaiting payment", value: String(data?.pendingCount ?? 0) },
        ].map((item) => (
          <div key={item.label} className="rounded-card border border-line-soft bg-paper p-5">
            <dt className="text-[13px] text-muted-ink">{item.label}</dt>
            <dd className="mt-2 font-display text-[27px] text-ink">{report.isLoading ? "—" : item.value}</dd>
          </div>
        ))}
      </dl>
      <section className="overflow-hidden rounded-card border border-line-soft bg-paper">
        <div className="flex items-center gap-3 border-b border-line-soft px-5 py-4">
          <HeartHandshake className="h-5 w-5 text-brand" strokeWidth={1.75} />
          <h2 className="text-[15px] font-semibold text-ink">Donation records</h2>
          <span className="ml-auto text-[13px] text-muted-ink">{data?.total ?? 0} total</span>
        </div>
        {report.isLoading ? <p className="p-8 text-sm text-muted-ink">Loading donations…</p> : null}
        {!report.isLoading && !data?.items.length ? <p className="p-8 text-center text-sm text-muted-ink">No direct donations yet.</p> : null}
        {data?.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-panel text-[12px] text-muted-ink"><tr><th className="px-5 py-3 font-medium">Donor</th><th className="px-5 py-3 font-medium">Amount</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Paid</th><th className="px-5 py-3 font-medium">Receipt</th><th className="px-5 py-3 font-medium">Paystack reference</th></tr></thead>
              <tbody className="divide-y divide-line-soft">
                {data.items.map((row) => (
                  <tr key={row.id}>
                    <td className="px-5 py-4"><span className="block font-medium text-ink">{row.donorName}</span><span className="text-[12px] text-muted-ink">{row.receiptEmail}</span>{row.note ? <span className="mt-1 block max-w-[220px] truncate text-[12px] text-ink-soft" title={row.note}>{row.note}</span> : null}</td>
                    <td className="px-5 py-4 font-medium tabular-nums text-ink">{formatMoney(row.amount)}</td>
                    <td className="px-5 py-4"><span className={cn("rounded-full px-2.5 py-1 text-[12px] font-medium", row.status === "SUCCEEDED" ? "bg-verified/10 text-verified-ink" : row.status === "PENDING" ? "bg-brand/10 text-brand-ink" : "bg-danger/10 text-danger")}>{row.status.toLowerCase()}</span></td>
                    <td className="px-5 py-4 text-ink-soft">{row.paidAt ? new Date(row.paidAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—"}</td>
                    <td className="px-5 py-4 text-ink-soft">{row.receiptSentAt ? "Sent" : row.status === "SUCCEEDED" ? "Pending" : "—"}</td>
                    <td className="max-w-[240px] break-all px-5 py-4 font-mono text-[11px] text-muted-ink">{row.paystackReference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
      <div className="flex items-center justify-end gap-3 text-sm text-muted-ink">
        <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className={btn("secondary", "sm")}>Previous</button>
        <span>Page {page}</span>
        <button type="button" disabled={!data?.hasMore} onClick={() => setPage((value) => value + 1)} className={btn("secondary", "sm")}>Next</button>
      </div>
    </AdminPage>
  );
}
