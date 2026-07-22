import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Landmark, Send, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import {
  finalizeAdminPayout,
  getAdminPayouts,
  releaseAdminPayout,
} from "@/features/catalog/api";
import { AdminPageWrapper } from "@/components/admin/AdminLayout";
import { PageSpinner } from "@/components/PageSpinner";
import { formatMoney } from "@/lib/catalog";

export const Route = createFileRoute("/admin/payouts")({
  component: AdminPayoutsPage,
});

function formatNumberInput(value: string) {
  if (!value) return "";
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString();
}

function AdminPayoutsPage() {
  const isClient = typeof window !== "undefined";
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "payouts"],
    queryFn: getAdminPayouts,
    enabled: isClient,
  });
  const [draftAmounts, setDraftAmounts] = useState<Record<string, string>>({});
  const [draftReasons, setDraftReasons] = useState<Record<string, string>>({});
  const [otpTransferId, setOtpTransferId] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const releaseMutation = useMutation({
    mutationFn: ({
      ownerType,
      ownerId,
      amount,
      reason,
    }: {
      ownerType: "USER" | "ORGANIZATION";
      ownerId: string;
      amount?: number;
      reason?: string;
    }) => releaseAdminPayout({ ownerType, ownerId, amount, reason }),
    onSuccess: (transfer) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payouts"] });
      if (transfer.status === "otp") {
        setOtpTransferId(transfer.id);
        toast.success("Payout initiated. Enter the Paystack OTP to finalize it.");
        return;
      }
      toast.success("Payout released successfully.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: () => finalizeAdminPayout(otpTransferId, { otp: otpCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payouts"] });
      setOtpCode("");
      setOtpTransferId("");
      toast.success("Payout finalized.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <AdminPageWrapper title="Payouts">
      <div className="space-y-6">
        {otpTransferId ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-700" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">Finalize Paystack payout</p>
                <p className="mt-1 text-sm text-amber-800">
                  Paystack requested an OTP before this transfer can complete. Enter the OTP sent for the transfer.
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={otpCode}
                    onChange={(event) =>
                      setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 12))
                    }
                    placeholder="Enter transfer OTP"
                    className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 sm:max-w-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!otpCode.trim()) {
                        toast.error("Enter the Paystack OTP first.");
                        return;
                      }
                      finalizeMutation.mutate();
                    }}
                    disabled={finalizeMutation.isPending}
                    className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
                  >
                    {finalizeMutation.isPending ? "Finalizing..." : "Finalize payout"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isLoading && !data ? (
          <PageSpinner label="Loading payouts..." fullScreen={false} />
        ) : null}

        {!isLoading && data && data.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <Landmark className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-3 text-sm font-medium text-gray-900">No payout owners yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Payout-eligible organizations and personal creators will show up here once they have a balance or a payout account.
            </p>
          </div>
        ) : null}

        {data?.items.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {data.items.map((item) => {
              const amountInput = draftAmounts[item.ownerId] ?? "";
              const amountDisplay = formatNumberInput(amountInput);
              const reasonInput = draftReasons[item.ownerId] ?? "";

              return (
                <div key={`${item.ownerType}-${item.ownerId}`} className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                        {item.ownerType === "organization" ? "Organization payout" : "Personal payout"}
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-gray-900">{item.ownerName}</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Verification: {item.verificationStatus.replaceAll("_", " ")}
                      </p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {item.campaignCount} campaign{item.campaignCount === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <PayoutStat label="Collected" value={formatMoney(item.totalCollected)} />
                    <PayoutStat label="Released" value={formatMoney(item.totalReleased)} />
                    <PayoutStat label="Available" value={formatMoney(item.availableBalance)} />
                  </div>

                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Destination account
                    </p>
                    {item.payoutAccount ? (
                      <>
                        <p className="mt-2 text-sm font-medium text-gray-900">
                          {item.payoutAccount.bankName} · {item.payoutAccount.accountNumberMasked}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {item.payoutAccount.accountName} · {item.payoutAccount.accountHolderName}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-rose-600">
                        No verified payout account has been saved yet.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3">
                    <input
                      value={amountDisplay}
                      onChange={(event) =>
                        setDraftAmounts((current) => ({
                          ...current,
                          [item.ownerId]: event.target.value.replace(/[^\d]/g, ""),
                        }))
                      }
                      placeholder={`Amount to release (max ${item.availableBalance.toLocaleString()})`}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <input
                      value={reasonInput}
                      onChange={(event) =>
                        setDraftReasons((current) => ({
                          ...current,
                          [item.ownerId]: event.target.value,
                        }))
                      }
                      placeholder="Reason for payout release"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!item.payoutAccount) {
                          toast.error("This owner needs a verified payout account first.");
                          return;
                        }
                        if (item.availableBalance <= 0) {
                          toast.error("There is no available balance to release.");
                          return;
                        }

                        const parsedAmount = amountInput.trim()
                          ? Number(amountInput.trim())
                          : undefined;
                        if (parsedAmount !== undefined && (!Number.isFinite(parsedAmount) || parsedAmount < 1)) {
                          toast.error("Enter a valid release amount.");
                          return;
                        }

                        releaseMutation.mutate({
                          ownerType: item.ownerType === "organization" ? "ORGANIZATION" : "USER",
                          ownerId: item.ownerId,
                          amount: parsedAmount,
                          reason: reasonInput.trim() || undefined,
                        });
                      }}
                      disabled={releaseMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
                    >
                      <Send className="h-4 w-4" />
                      {releaseMutation.isPending ? "Releasing..." : "Release payout"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
            Payout history
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-[0.18em] text-gray-500">
                <tr>
                  <th className="px-3 py-3">Owner</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Reference</th>
                  <th className="px-3 py-3">Released by</th>
                  <th className="px-3 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {(data?.history ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-500">
                      No payout history yet.
                    </td>
                  </tr>
                ) : (
                  data?.history.map((transfer) => (
                    <tr key={transfer.id} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-3 py-3 font-medium text-gray-900">{transfer.ownerName}</td>
                      <td className="px-3 py-3 text-gray-700">{formatMoney(transfer.amount)}</td>
                      <td className="px-3 py-3 text-gray-700">{transfer.status.replaceAll("_", " ")}</td>
                      <td className="px-3 py-3 text-xs text-gray-500">{transfer.reference}</td>
                      <td className="px-3 py-3 text-gray-700">{transfer.releasedByEmail}</td>
                      <td className="px-3 py-3 text-gray-700">
                        {new Date(transfer.releasedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  );
}

function PayoutStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <p className="text-lg font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </div>
  );
}
