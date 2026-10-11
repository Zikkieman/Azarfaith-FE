import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { formatAmountInput, formatMoney, parseAmountInput } from "@/lib/catalog";
import type { PayoutRequest } from "@/lib/payout-request";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
export function PayoutRequests({
  organizationId,
  balance,
  verified,
}: {
  organizationId?: string;
  balance: number;
  verified: boolean;
}) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["payout-requests"],
    queryFn: () => apiFetch<PayoutRequest[]>("/me/payout-requests"),
  });
  const [open, setOpen] = useState(false),
    [amount, setAmount] = useState(""),
    [note, setNote] = useState("");
  const [requestId, setRequestId] = useState("");
  const rows =
    query.data?.filter((row) =>
      organizationId
        ? row.ownerType === "ORGANIZATION" && row.ownerId === organizationId
        : row.ownerType === "USER",
    ) ?? [];
  const pending = rows.some((row) => row.status === "OPEN");
  const create = useMutation({
    mutationFn: () =>
      apiFetch("/me/payout-requests", {
        method: "POST",
        body: JSON.stringify({
          requestId,
          organizationId,
          amount: parseAmountInput(amount),
          note: note.trim() || undefined,
        }),
      }),
    onSuccess: () => {
      setOpen(false);
      void client.invalidateQueries({ queryKey: ["payout-requests"] });
    },
  });
  return (
    <div className="space-y-3 border-t border-line-soft pt-4">
      <button
        className="dashboard-button w-full"
        disabled={!verified || balance <= 0 || pending || !query.data || create.isPending}
        onClick={() => {
          setRequestId(crypto.randomUUID());
          setAmount(formatAmountInput(String(balance)));
          setNote("");
          create.reset();
          setOpen(true);
        }}
      >
        {pending ? "Payout requested" : "Request payout"}
      </button>
      <p className="text-xs text-muted-ink">
        Requests need admin approval. They do not transfer or reserve money. Availability is checked
        again when funds are released.
      </p>
      {query.isError && (
        <p role="alert" className="text-xs text-red-700">
          Could not load payout requests.{" "}
          <button className="underline" onClick={() => void query.refetch()}>
            Retry
          </button>
        </p>
      )}
      {rows.slice(0, 3).map((row) => (
        <div key={row.id} className="rounded-lg bg-panel p-3 text-xs">
          <p className="font-medium">
            {formatMoney(row.amount)} ·{" "}
            {row.transfer?.status ??
              (row.status === "OPEN"
                ? "Awaiting review"
                : row.status === "DECLINED"
                  ? "Not approved"
                  : "Processing")}
          </p>
          <p className="mt-1 text-muted-ink">
            {new Date(row.createdAt).toLocaleDateString()}
            {row.decisionReason ? ` · ${row.decisionReason}` : ""}
          </p>
        </div>
      ))}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!create.isPending) setOpen(value);
        }}
      >
        <DialogContent>
          <DialogTitle>Request a payout</DialogTitle>
          <DialogDescription>
            An admin will review this request and your bank details. No payment is sent until an
            admin explicitly releases it.
          </DialogDescription>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const value = parseAmountInput(amount);
              if (Number.isSafeInteger(value) && value > 0 && value <= balance) create.mutate();
            }}
          >
            <label className="giving-label">
              Amount (NGN)
              <input
                required
                className="giving-input"
                inputMode="numeric"
                disabled={create.isPending}
                value={amount}
                onChange={(event) => setAmount(formatAmountInput(event.target.value))}
              />
            </label>
            <p className="text-xs text-muted-ink">Available: {formatMoney(balance)}</p>
            <label className="giving-label">
              Note (optional)
              <textarea
                className="giving-input"
                maxLength={240}
                disabled={create.isPending}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
            {create.isError && (
              <p role="alert" className="text-sm text-red-700">
                {create.error.message} Retry uses the same request ID.
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="giving-small-button"
                disabled={create.isPending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="giving-small-button bg-black text-white"
                disabled={
                  create.isPending ||
                  !Number.isSafeInteger(parseAmountInput(amount)) ||
                  parseAmountInput(amount) <= 0 ||
                  parseAmountInput(amount) > balance
                }
              >
                {create.isPending ? "Submitting..." : "Submit request"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
