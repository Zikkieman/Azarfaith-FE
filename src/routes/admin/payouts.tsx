import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Landmark, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  finalizeAdminPayout,
  getAdminPayouts,
  reconcileAdminPayout,
  releaseAdminPayout,
} from "@/features/catalog/api";
import { AdminPageWrapper } from "@/components/admin/AdminLayout";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { PageSpinner } from "@/components/PageSpinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatMoney,
  formatAmountInput,
  parseAmountInput,
  type AdminPayoutItem,
} from "@/lib/catalog";
import { payoutOutcome, payoutReleaseError } from "@/lib/admin";
import { adminApiFetch } from "@/lib/api";
import type { PayoutRequest } from "@/lib/payout-request";
import { AdminRejectDialog } from "@/components/admin/AdminRejectDialog";

export const Route = createFileRoute("/admin/payouts")({ component: AdminPayoutsPage });
type Release = { item: AdminPayoutItem; amount: number; reason: string; requestId: string };

function AdminPayoutsPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "payouts"], queryFn: getAdminPayouts });
  const requests = useQuery({
    queryKey: ["admin", "payout-requests"],
    queryFn: () => adminApiFetch<PayoutRequest[]>("/admin/review/payout-requests"),
  });
  const [decline, setDecline] = useState<PayoutRequest | null>(null);
  const declineMutation = useMutation({
    mutationFn: (reason: string) =>
      adminApiFetch(`/admin/review/payout-requests/${decline!.id}/decline`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      setDecline(null);
      void client.invalidateQueries({ queryKey: ["admin"] });
      void client.invalidateQueries({ queryKey: ["payout-requests"] });
    },
  });
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState<Release | null>(null);
  const [otpTransferId, setOtpTransferId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["admin"] });
    void client.invalidateQueries({ queryKey: ["payout-summary"] });
    void client.invalidateQueries({ queryKey: ["dashboard"] });
    void client.invalidateQueries({ queryKey: ["payout-requests"] });
  };
  const release = useMutation({
    mutationFn: (value: Release) =>
      releaseAdminPayout({
        requestId: value.requestId,
        ownerType: value.item.ownerType === "user" ? "USER" : "ORGANIZATION",
        ownerId: value.item.ownerId,
        amount: value.amount,
        reason: value.reason,
      }),
    onSuccess: (result, value) => {
      refresh();
      setConfirmation(null);
      setAmounts((old) => ({ ...old, [`${value.item.ownerType}:${value.item.ownerId}`]: "" }));
      toast.info(payoutOutcome(result.status));
      if (result.status === "otp") {
        setOtpTransferId(result.id);
        setOtp("");
      }
    },
    onError: (error: Error) => {
      refresh();
      toast.error(error.message);
    },
  });
  const finalize = useMutation({
    mutationFn: () => finalizeAdminPayout(otpTransferId!, { otp }),
    onSuccess: (result) => {
      refresh();
      toast.info(payoutOutcome(result.status));
      if (result.status !== "otp") {
        setOtpTransferId(null);
        setOtp("");
      }
    },
    onError: (error: Error) => {
      refresh();
      toast.error(error.message);
    },
  });
  const reconcile = useMutation({
    mutationFn: reconcileAdminPayout,
    onSuccess: (result) => {
      refresh();
      toast.info(payoutOutcome(result.status));
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const busy = release.isPending || finalize.isPending || reconcile.isPending;
  return (
    <AdminPageWrapper
      title="Payouts"
      lead="Review the destination and net balance before releasing money through Paystack."
      actions={
        <button
          type="button"
          className="giving-small-button"
          disabled={busy || query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      }
    >
      {query.isPending ? (
        <PageSpinner label="Loading payouts" fullScreen={false} />
      ) : query.isError ? (
        <AdminLoadError
          retry={() => void query.refetch()}
          message="Could not load payout balances. No release is available until balances can be checked."
        />
      ) : (
        query.data && (
          <div className="space-y-8">
            <section className="rounded-xl border border-line-soft bg-white p-5">
              <h2 className="mb-4 font-semibold">Creator payout requests</h2>
              <p className="mb-4 text-xs text-muted-ink">
                Latest 50 requests. A request is not a completed payment.
              </p>
              {requests.isError ? (
                <AdminLoadError retry={() => void requests.refetch()} />
              ) : !requests.data ? (
                <p role="status" className="text-sm">
                  Loading requests...
                </p>
              ) : !requests.data.length ? (
                <p className="text-sm text-muted-ink">No payout requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {requests.data.map((request) => {
                    const item = query.data.items.find(
                      (item) =>
                        item.ownerId === request.ownerId &&
                        item.ownerType === (request.ownerType === "USER" ? "user" : "organization"),
                    );
                    return (
                      <article
                        key={request.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line-soft p-4"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {request.ownerName} · {formatMoney(request.amount)}
                          </p>
                          <p className="mt-1 text-xs text-muted-ink">
                            {request.transfer?.status ??
                              (request.status === "OPEN"
                                ? "Awaiting review"
                                : request.status.toLowerCase())}{" "}
                            · {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                          {request.note && <p className="mt-2 text-xs">{request.note}</p>}
                          {request.decisionReason && (
                            <p className="mt-2 text-xs text-red-700">{request.decisionReason}</p>
                          )}
                        </div>
                        {request.status === "OPEN" && !request.transfer && (
                          <div className="flex gap-2">
                            <button
                              className="giving-small-button"
                              disabled={!item || !!payoutReleaseError(item, request.amount) || busy}
                              onClick={() => {
                                if (item) {
                                  release.reset();
                                  setConfirmation({
                                    item,
                                    amount: request.amount,
                                    reason: request.note ?? "Creator payout request",
                                    requestId: request.id,
                                  });
                                }
                              }}
                            >
                              Review payout
                            </button>
                            <button
                              className="giving-small-button text-red-700"
                              disabled={busy || declineMutation.isPending}
                              onClick={() => {
                                declineMutation.reset();
                                setDecline(request);
                              }}
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
            <div className="rounded-xl border border-line-soft bg-panel p-4 text-sm leading-relaxed text-muted-ink">
              Available funds are net of platform fees. Processing and OTP payouts reserve their
              amounts. A submitted payout is not proof of payment; its status must be confirmed by
              Paystack.
            </div>
            {!query.data.items.length ? (
              <div className="rounded-xl border border-dashed border-line-input p-10 text-center">
                <Landmark className="mx-auto h-6 w-6 text-muted-ink" />
                <h2 className="mt-3 text-sm font-medium">No payout owners yet</h2>
                <p className="mt-2 text-sm text-muted-ink">
                  Creators with a bank account or collected funds will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {query.data.items.map((item) => {
                  const key = `${item.ownerType}:${item.ownerId}`;
                  const rawAmount = amounts[key] ?? "";
                  return (
                    <section
                      key={key}
                      className="min-w-0 rounded-xl border border-line-soft bg-paper p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-ink">
                            {item.ownerType === "organization"
                              ? "Organization"
                              : "Personal creator"}
                          </p>
                          <h2 className="mt-1 text-lg font-semibold">{item.ownerName}</h2>
                        </div>
                        <span className="shrink-0 rounded-md bg-panel px-2 py-1 text-xs">
                          {item.campaignCount} campaigns
                        </span>
                      </div>
                      <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {[
                          ["Collected", item.totalCollected],
                          ["Platform fees", item.totalPlatformFees],
                          ["Net collected", item.totalNetCollected],
                          ["Released / reserved", item.totalReleased],
                          ["Available", item.availableBalance],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <dt className="text-xs text-muted-ink">{label}</dt>
                            <dd className="mt-1 text-base font-medium tabular-nums">
                              {formatMoney(Number(value))}
                            </dd>
                          </div>
                        ))}
                      </dl>
                      <div className="my-5 rounded-xl bg-panel p-4 text-sm">
                        <p className="text-xs text-muted-ink">Destination account</p>
                        {item.payoutAccount ? (
                          <>
                            <p className="mt-2 font-medium">
                              {item.payoutAccount.bankName} ·{" "}
                              {item.payoutAccount.accountNumberMasked}
                            </p>
                            <p className="mt-1">{item.payoutAccount.accountName}</p>
                            <p className="mt-1 text-xs text-muted-ink">
                              {item.payoutAccount.active ? item.payoutAccount.status : "inactive"}
                              {item.payoutAccount.ownerType === "user" &&
                              item.ownerType === "organization"
                                ? " · inherited profile account"
                                : ""}
                            </p>
                          </>
                        ) : (
                          <p className="mt-2 text-red-700">No verified payout account saved.</p>
                        )}
                      </div>
                      <fieldset disabled={busy} className="space-y-4">
                        <label className="giving-label">
                          Amount to release for {item.ownerName}
                          <input
                            className="giving-input"
                            inputMode="numeric"
                            value={formatAmountInput(rawAmount)}
                            onChange={(event) =>
                              setAmounts((old) => ({
                                ...old,
                                [key]: event.target.value.replace(/\D/g, ""),
                              }))
                            }
                            placeholder={`Up to ${formatMoney(item.availableBalance)}`}
                          />
                        </label>
                        <label className="giving-label">
                          Release reason for {item.ownerName}
                          <input
                            className="giving-input"
                            maxLength={240}
                            value={reasons[key] ?? ""}
                            onChange={(event) =>
                              setReasons((old) => ({ ...old, [key]: event.target.value }))
                            }
                            placeholder="Optional audit note"
                          />
                        </label>
                        <button
                          type="button"
                          className="w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-40"
                          disabled={busy || !!payoutReleaseError(item, parseAmountInput(rawAmount))}
                          onClick={() => {
                            const amount = parseAmountInput(rawAmount),
                              error = payoutReleaseError(item, amount);
                            if (error) {
                              toast.error(error);
                              return;
                            }
                            release.reset();
                            setConfirmation({
                              item,
                              amount,
                              reason: (reasons[key] ?? "").trim(),
                              requestId: crypto.randomUUID(),
                            });
                          }}
                        >
                          Review payout
                        </button>
                      </fieldset>
                    </section>
                  );
                })}
              </div>
            )}
            <section>
              <h2 className="mb-4 text-base font-semibold">Recent transfer history</h2>
              <p className="mb-4 text-xs text-muted-ink">
                Latest 50 transfers. Status checks do not send a new payment.
              </p>
              {!query.data.history.length ? (
                <p className="text-sm text-muted-ink">No payout history yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-line-soft">
                  <table className="w-full min-w-[780px] text-left text-sm">
                    <thead>
                      <tr>
                        {[
                          "Recipient",
                          "Amount",
                          "Status",
                          "Reference / reason",
                          "Released by",
                          "Actions",
                        ].map((label) => (
                          <th key={label} className="px-4 py-3">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {query.data.history.map((transfer) => (
                        <tr key={transfer.id} className="border-t border-line-soft">
                          <td className="px-4">
                            {transfer.ownerName}
                            <time
                              className="mt-1 block text-xs text-muted-ink"
                              dateTime={transfer.releasedAt}
                            >
                              {new Date(transfer.releasedAt).toLocaleString("en-NG")}
                            </time>
                          </td>
                          <td className="px-4 tabular-nums">{formatMoney(transfer.amount)}</td>
                          <td className="px-4">
                            <span className="rounded-md bg-panel px-2 py-1 text-xs">
                              {transfer.status}
                            </span>
                          </td>
                          <td className="max-w-60 px-4">
                            <p className="break-all text-xs">{transfer.reference}</p>
                            <p className="mt-1 text-xs text-muted-ink">{transfer.reason}</p>
                            {transfer.failureMessage && (
                              <p className="mt-1 text-xs text-red-700">{transfer.failureMessage}</p>
                            )}
                          </td>
                          <td className="px-4 text-xs">{transfer.releasedByEmail}</td>
                          <td className="px-4">
                            <div className="flex flex-col gap-2">
                              {transfer.status === "otp" && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  className="giving-small-button"
                                  onClick={() => {
                                    finalize.reset();
                                    setOtpTransferId(transfer.id);
                                    setOtp("");
                                  }}
                                >
                                  Enter OTP
                                </button>
                              )}
                              {["pending", "otp", "success"].includes(transfer.status) && (
                                <button
                                  type="button"
                                  className="giving-small-button"
                                  disabled={busy}
                                  onClick={() => reconcile.mutate(transfer.id)}
                                >
                                  Check status
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )
      )}
      <Dialog
        open={!!confirmation}
        onOpenChange={(open) => {
          if (!open && !release.isPending) setConfirmation(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm payout release</DialogTitle>
            <DialogDescription>
              Paystack will transfer this amount to the destination below. Review it carefully.
            </DialogDescription>
          </DialogHeader>
          {confirmation && (
            <>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-ink">Recipient</dt>
                  <dd className="font-medium">{confirmation.item.ownerName}</dd>
                </div>
                <div>
                  <dt className="text-muted-ink">Amount</dt>
                  <dd className="text-xl font-semibold">{formatMoney(confirmation.amount)}</dd>
                </div>
                <div>
                  <dt className="text-muted-ink">Bank account</dt>
                  <dd>
                    {confirmation.item.payoutAccount?.bankName} ·{" "}
                    {confirmation.item.payoutAccount?.accountNumberMasked}
                  </dd>
                  <dd>{confirmation.item.payoutAccount?.accountName}</dd>
                </div>
              </dl>
              {release.isError && (
                <p role="alert" className="text-sm text-red-700">
                  {release.error.message}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  className="giving-small-button"
                  disabled={release.isPending}
                  onClick={() => setConfirmation(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-xl bg-black px-4 py-3 text-sm text-white disabled:opacity-40"
                  disabled={release.isPending}
                  onClick={() => release.mutate(confirmation)}
                >
                  {release.isPending ? "Submitting..." : "Release via Paystack"}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!otpTransferId}
        onOpenChange={(open) => {
          if (!open && !finalize.isPending) {
            setOtpTransferId(null);
            setOtp("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Paystack OTP</DialogTitle>
            <DialogDescription>
              Enter the OTP sent by Paystack. This completes the existing transfer, not a new
              payment.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (/^\d{4,12}$/.test(otp)) finalize.mutate();
            }}
          >
            <label className="giving-label">
              Transfer OTP
              <input
                className="giving-input"
                value={otp}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                pattern="[0-9]{4,12}"
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 12))}
              />
            </label>
            {finalize.isError && (
              <p role="alert" className="text-sm text-red-700">
                {finalize.error.message}
              </p>
            )}
            <button
              type="submit"
              className="w-full rounded-xl bg-black px-4 py-3 text-sm text-white disabled:opacity-40"
              disabled={finalize.isPending || !/^\d{4,12}$/.test(otp)}
            >
              {finalize.isPending ? "Confirming..." : "Confirm transfer"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
      <AdminRejectDialog
        key={decline?.id}
        open={Boolean(decline)}
        onOpenChange={(value) => {
          if (!value) setDecline(null);
        }}
        title="Decline payout request"
        description="Explain why this payout request is not approved. No transfer will be initiated."
        confirmLabel="Decline request"
        minLength={5}
        error={declineMutation.isError ? declineMutation.error.message : undefined}
        pending={declineMutation.isPending}
        onReject={(reason) => declineMutation.mutate(reason)}
      />
    </AdminPageWrapper>
  );
}
