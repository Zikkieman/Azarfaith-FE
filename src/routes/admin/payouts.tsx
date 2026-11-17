import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BanknoteArrowUp, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AdminPage } from "@/components/admin/AdminLayout";
import { btn } from "@/components/app/btn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { formatMoney } from "@/lib/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/payouts")({
  head: () => ({ meta: [{ title: "Payout requests — Admin" }] }),
  component: Payouts,
});

type RequestRow = {
  id: string;
  ownerType: "USER" | "ORGANIZATION";
  ownerId: string;
  ownerName: string;
  amount: number;
  note: string | null;
  status: "OPEN" | "PROCESSING" | "DECLINED";
  decisionReason: string | null;
  createdAt: string;
  transfer: { id: string; status: string } | null;
};

type PayoutAccount = {
  bankName: string;
  accountName: string;
  accountNumberMasked: string;
  status: string;
  active: boolean;
};

type OwnerBalance = {
  ownerType: "user" | "organization";
  ownerId: string;
  ownerName: string;
  verificationStatus: string;
  availableBalance: number;
  totalCollected: number;
  totalReleased: number;
  payoutAccount: PayoutAccount | null;
};

type Transfer = {
  id: string;
  ownerName: string;
  amount: number;
  status: string;
  reference: string;
  failureMessage: string | null;
  releasedAt: string;
  releasedByEmail: string;
};

type PayoutReport = { items: OwnerBalance[]; history: Transfer[] };

function Payouts() {
  const queryClient = useQueryClient();
  const requests = useQuery({
    queryKey: ["admin", "payout-requests"],
    queryFn: () => apiFetch<RequestRow[]>("/admin/review/payout-requests", { cache: "no-store" }),
  });
  const report = useQuery({
    queryKey: ["admin", "payouts"],
    queryFn: () => apiFetch<PayoutReport>("/admin/review/payouts", { cache: "no-store" }),
  });
  const [release, setRelease] = useState<RequestRow | null>(null);
  const [decline, setDecline] = useState<RequestRow | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [otpByTransfer, setOtpByTransfer] = useState<Record<string, string>>({});

  const refresh = async () => {
    await Promise.all([requests.refetch(), report.refetch()]);
  };
  const balanceFor = (request: RequestRow) =>
    report.data?.items.find(
      (item) =>
        item.ownerId === request.ownerId && item.ownerType === request.ownerType.toLowerCase(),
    );
  const sendRelease = async () => {
    if (!release || busy) return;
    setBusy(true);
    try {
      const transfer = await apiFetch<{ status: string }>("/admin/review/payouts/release", {
        method: "PATCH",
        body: JSON.stringify({
          requestId: release.id,
          ownerType: release.ownerType,
          ownerId: release.ownerId,
          amount: release.amount,
          reason: reason.trim() || undefined,
        }),
      });
      toast.success(
        transfer.status === "success"
          ? "Payout sent successfully."
          : `Payout submitted: ${transfer.status}.`,
      );
      setRelease(null);
      setReason("");
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not release this payout.");
    } finally {
      setBusy(false);
    }
  };
  const sendDecline = async () => {
    if (!decline || reason.trim().length < 5 || busy) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/review/payout-requests/${decline.id}/decline`, {
        method: "PATCH",
        body: JSON.stringify({ reason: reason.trim() }),
      });
      toast.success("Payout request declined.");
      setDecline(null);
      setReason("");
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not decline this request.");
    } finally {
      setBusy(false);
    }
  };
  const reconcile = async (id: string) => {
    try {
      const result = await apiFetch<{ status: string }>(`/admin/review/payouts/${id}/reconcile`, {
        method: "PATCH",
      });
      toast.success(`Payout status: ${result.status}.`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reconcile this payout.");
    }
  };
  const finalize = async (id: string) => {
    const otp = otpByTransfer[id]?.trim();
    if (!otp) return;
    try {
      const result = await apiFetch<{ status: string }>(`/admin/review/payouts/${id}/finalize`, {
        method: "PATCH",
        body: JSON.stringify({ otp }),
      });
      toast.success(`Payout status: ${result.status}.`);
      setOtpByTransfer((current) => ({ ...current, [id]: "" }));
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not finalize this payout.");
    }
  };

  const openRequests = requests.data?.filter((request) => request.status === "OPEN") ?? [];
  return (
    <AdminPage
      title="Payout requests"
      count={openRequests.length}
      lead="Review creator requests and release funds only to their verified payout account."
      crumbs={[{ label: "Overview", to: "/admin" }, { label: "Payout requests" }]}
      actions={
        <button
          type="button"
          onClick={() => {
            void refresh();
          }}
          disabled={requests.isFetching || report.isFetching}
          className={btn("secondary", "sm")}
        >
          <RefreshCw
            className={cn("h-4 w-4", (requests.isFetching || report.isFetching) && "animate-spin")}
          />{" "}
          Refresh
        </button>
      }
    >
      {requests.error || report.error ? (
        <p
          role="alert"
          className="rounded-card border border-danger/20 bg-danger/5 p-5 text-sm text-danger"
        >
          Could not load payout requests. Try refreshing.
        </p>
      ) : null}
      <section className="overflow-hidden rounded-card border border-line-soft bg-paper">
        <div className="flex items-center gap-3 border-b border-line-soft px-5 py-4">
          <BanknoteArrowUp className="h-5 w-5 text-brand" />
          <h2 className="text-[15px] font-semibold text-ink">Waiting for review</h2>
        </div>
        {requests.isLoading || report.isLoading ? (
          <p className="p-8 text-sm text-muted-ink">Loading payout requests…</p>
        ) : null}
        {!requests.isLoading && !openRequests.length ? (
          <p className="p-8 text-center text-sm text-muted-ink">No payout requests are waiting.</p>
        ) : null}
        {openRequests.map((request) => {
          const owner = balanceFor(request);
          const account = owner?.payoutAccount;
          const releasable = Boolean(
            account?.active &&
            account.status === "verified" &&
            owner &&
            request.amount <= owner.availableBalance,
          );
          return (
            <article
              key={request.id}
              className="grid gap-4 border-b border-line-soft p-5 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-ink">{request.ownerName}</h3>
                  <span className="rounded-full bg-panel px-2.5 py-1 text-[11px] uppercase text-muted-ink">
                    {request.ownerType.toLowerCase()}
                  </span>
                </div>
                <p className="mt-1 font-display text-[24px] text-ink">
                  {formatMoney(request.amount)}
                </p>
                <p className="mt-1 text-[13px] text-muted-ink">
                  Requested{" "}
                  {new Date(request.createdAt).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                {request.note ? (
                  <p className="mt-3 rounded-field bg-panel px-3 py-2 text-sm text-ink-soft">
                    {request.note}
                  </p>
                ) : null}
                <div className="mt-3 text-sm text-ink-soft">
                  {account ? (
                    <>
                      <ShieldCheck className="mr-1 inline h-4 w-4 text-verified" />{" "}
                      {account.bankName} · {account.accountNumberMasked} · {account.accountName}
                      <span className="ml-2 text-muted-ink">
                        Available {formatMoney(owner?.availableBalance ?? 0)}
                      </span>
                    </>
                  ) : (
                    <span className="text-danger">No verified payout account</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={btn("secondary", "sm")}
                  onClick={() => {
                    setReason("");
                    setDecline(request);
                  }}
                >
                  Decline
                </button>
                <button
                  type="button"
                  disabled={!releasable}
                  title={
                    !releasable
                      ? "The verified account or available balance is not ready."
                      : undefined
                  }
                  className={btn("primary", "sm")}
                  onClick={() => {
                    setReason("");
                    setRelease(request);
                  }}
                >
                  Release {formatMoney(request.amount)}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-card border border-line-soft bg-paper">
        <div className="border-b border-line-soft px-5 py-4">
          <h2 className="text-[15px] font-semibold text-ink">Transfer history</h2>
        </div>
        {!report.data?.history.length ? (
          <p className="p-8 text-center text-sm text-muted-ink">
            No payouts have been released yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-panel text-[12px] text-muted-ink">
                <tr>
                  <th className="px-5 py-3 font-medium">Recipient</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {report.data?.history.map((transfer) => (
                  <tr key={transfer.id}>
                    <td className="px-5 py-4">
                      <span className="font-medium text-ink">{transfer.ownerName}</span>
                      <span className="block text-[12px] text-muted-ink">
                        {new Date(transfer.releasedAt).toLocaleDateString("en-NG")}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-ink">
                      {formatMoney(transfer.amount)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="capitalize text-ink-soft">{transfer.status}</span>
                      {transfer.failureMessage ? (
                        <span className="block max-w-[260px] text-[12px] text-danger">
                          {transfer.failureMessage}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] text-muted-ink">
                      {transfer.reference}
                    </td>
                    <td className="px-5 py-4">
                      {transfer.status === "otp" ? (
                        <div className="flex gap-2">
                          <input
                            aria-label="Paystack transfer OTP"
                            inputMode="numeric"
                            value={otpByTransfer[transfer.id] ?? ""}
                            onChange={(event) =>
                              setOtpByTransfer((current) => ({
                                ...current,
                                [transfer.id]: event.target.value.replace(/\D/g, "").slice(0, 6),
                              }))
                            }
                            className="w-24 rounded-field border border-line-input px-3 py-2"
                            placeholder="OTP"
                          />
                          <button
                            type="button"
                            className={btn("primary", "sm")}
                            onClick={() => {
                              void finalize(transfer.id);
                            }}
                          >
                            Finalize
                          </button>
                        </div>
                      ) : ["pending", "failed"].includes(transfer.status) ? (
                        <button
                          type="button"
                          className={btn("secondary", "sm")}
                          onClick={() => {
                            void reconcile(transfer.id);
                          }}
                        >
                          Check status
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(release)}
        onOpenChange={(next) => {
          if (!next && !busy) setRelease(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release this payout?</DialogTitle>
            <DialogDescription>
              {release
                ? `${formatMoney(release.amount)} will be sent to ${release.ownerName}'s verified payout account. This action starts a real Paystack transfer.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-2 text-sm font-medium text-ink">
            Transfer note <span className="font-normal text-muted-ink">(optional)</span>
            <textarea
              rows={3}
              maxLength={240}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="resize-none rounded-field border border-line-input px-4 py-3 font-normal"
            />
          </label>
          <DialogFooter>
            <button
              type="button"
              className={btn("secondary")}
              disabled={busy}
              onClick={() => setRelease(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={btn("primary")}
              disabled={busy}
              onClick={() => {
                void sendRelease();
              }}
            >
              {busy ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" /> Releasing…
                </>
              ) : (
                "Confirm release"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(decline)}
        onOpenChange={(next) => {
          if (!next && !busy) setDecline(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline payout request?</DialogTitle>
            <DialogDescription>
              The creator will see your reason and can submit another request after correcting the
              issue.
            </DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-2 text-sm font-medium text-ink">
            Reason
            <textarea
              autoFocus
              rows={4}
              maxLength={1000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="resize-none rounded-field border border-line-input px-4 py-3 font-normal"
            />
          </label>
          <DialogFooter>
            <button
              type="button"
              className={btn("secondary")}
              disabled={busy}
              onClick={() => setDecline(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={btn("danger")}
              disabled={busy || reason.trim().length < 5}
              onClick={() => {
                void sendDecline();
              }}
            >
              {busy ? "Declining…" : "Decline request"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
