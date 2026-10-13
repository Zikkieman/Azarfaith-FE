import { useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ellipsis } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatAmountInput, formatMoney, parseAmountInput } from "@/lib/catalog";
import type { PayoutRequest } from "@/lib/payout-request";
import * as DefaultDialog from "@/components/ui/dialog";
import * as DesignDialog from "@/components/app/DesignDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { inputClass, labelClass } from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import { useAppSelector } from "@/app/hooks";
import { cn } from "@/lib/utils";

export function PayoutRequests({
  organizationId,
  balance,
  verified,
  appearance = "default",
  detailsLink,
  className,
}: {
  organizationId?: string;
  balance: number;
  verified: boolean;
  appearance?: "default" | "designer";
  detailsLink?: ReactNode;
  className?: string;
}) {
  const designer = appearance === "designer";
  const { Dialog, DialogContent, DialogDescription, DialogTitle } = designer
    ? DesignDialog
    : DefaultDialog;
  const userId = useAppSelector((state) => state.auth.user?.id);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["payout-requests", userId],
    queryFn: () => apiFetch<PayoutRequest[]>("/me/payout-requests"),
    enabled: Boolean(userId),
  });
  const [open, setOpen] = useState(false),
    [historyOpen, setHistoryOpen] = useState(false),
    [amount, setAmount] = useState(""),
    [note, setNote] = useState("");
  const [requestId, setRequestId] = useState("");
  const submitting = useRef(false);
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
    onSettled: () => {
      submitting.current = false;
    },
  });
  const label = designer ? cn(labelClass, "flex flex-col gap-2") : "giving-label";
  const input = designer ? inputClass : "giving-input";
  const history = rows.slice(0, 3).map((row) => (
    <div
      key={row.id}
      className={
        designer ? "rounded-field bg-panel p-3 text-xs" : "rounded-lg bg-panel p-3 text-xs"
      }
    >
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
  ));
  const readError = query.isError ? (
    <p role="alert" className="text-xs text-danger">
      Could not load payout requests.{" "}
      <button type="button" className="underline" onClick={() => void query.refetch()}>
        Retry
      </button>
    </p>
  ) : null;
  return (
    <div className={designer ? "contents" : "space-y-3 border-t border-line-soft pt-4"}>
      {(!designer || verified) && (
        <button
          type="button"
          className={
            designer
              ? (className ?? cn(btn("secondary", "sm"), "self-start"))
              : "dashboard-button w-full"
          }
          title="Request a payout for admin approval"
          disabled={!verified || balance <= 0 || pending || !query.data || create.isPending}
          onClick={() => {
            setRequestId(crypto.randomUUID());
            setAmount(formatAmountInput(String(balance)));
            setNote("");
            create.reset();
            setOpen(true);
          }}
        >
          {pending ? "Payout requested" : designer ? "Pay out now" : "Request payout"}
        </button>
      )}
      {designer ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Payout options"
              className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full text-muted-ink hover:bg-panel hover:text-ink"
            >
              <Ellipsis className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="designer-app w-60 max-w-[calc(100vw-32px)] rounded-field border border-line-soft bg-paper p-1.5 shadow-none"
          >
            <DropdownMenuItem
              onSelect={() => setHistoryOpen(true)}
              className="flex cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2.5 font-gsf text-sm text-ink focus:bg-panel"
            >
              View payout requests
            </DropdownMenuItem>
            {detailsLink ? (
              <DropdownMenuItem
                asChild
                className="flex cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2.5 font-gsf text-sm text-ink focus:bg-panel"
              >
                {detailsLink}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <>
          <p className="text-xs text-muted-ink">
            Requests need admin approval. They do not transfer or reserve money. Availability is
            checked again when funds are released.
          </p>
          {history}
        </>
      )}
      {readError}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className={designer ? "max-h-[90dvh] overflow-y-auto" : undefined}>
          <DialogTitle>Payout requests</DialogTitle>
          <DialogDescription>
            Requests need admin approval. They do not transfer or reserve money. Availability is
            checked again when funds are released.
          </DialogDescription>
          {query.isPending ? (
            <p role="status">Loading requests...</p>
          ) : query.isError ? (
            readError
          ) : rows.length ? (
            <div className="space-y-3">{history}</div>
          ) : (
            <p className="text-sm text-muted-ink">No payout requests yet.</p>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!create.isPending) setOpen(value);
        }}
      >
        <DialogContent className={designer ? "max-h-[90dvh] overflow-y-auto" : undefined}>
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
              if (
                !submitting.current &&
                Number.isSafeInteger(value) &&
                value > 0 &&
                value <= balance &&
                verified &&
                !pending &&
                query.data
              ) {
                submitting.current = true;
                create.mutate();
              }
            }}
          >
            <label className={label}>
              Amount (NGN)
              <input
                required
                className={input}
                inputMode="numeric"
                disabled={create.isPending}
                value={amount}
                onChange={(event) => setAmount(formatAmountInput(event.target.value))}
              />
            </label>
            <p className="text-xs text-muted-ink">
              Available: {formatMoney(balance)}. Net of platform fees and released or reserved
              transfers.
            </p>
            <label className={label}>
              Note (optional)
              <textarea
                className={input}
                maxLength={240}
                disabled={create.isPending}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
            {create.isError && (
              <p role="alert" className="text-sm text-danger">
                {create.error.message} Retry uses the same request ID.
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className={designer ? btn("secondary", "sm") : "giving-small-button"}
                disabled={create.isPending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={
                  designer ? btn("primary", "sm") : "giving-small-button bg-black text-white"
                }
                disabled={
                  create.isPending ||
                  !verified ||
                  pending ||
                  !query.data ||
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
