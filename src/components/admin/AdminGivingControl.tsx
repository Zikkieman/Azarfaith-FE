import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApiFetch } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminLoadError } from "./AdminLoadError";

export type GivingControl = {
  givingPaused: boolean;
  givingVersion: number;
  givingPausedAt: string | null;
  givingPauseReason: string | null;
};
const givingControlQuery = {
  queryKey: ["admin", "giving-control"],
  queryFn: () => adminApiFetch<GivingControl>("/admin/review/giving-control"),
};

export function AdminGivingControl() {
  const client = useQueryClient();
  const query = useQuery({ ...givingControlQuery, refetchInterval: 30_000 });
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<GivingControl | null>(null);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const mutation = useMutation({
    mutationFn: (state: GivingControl) =>
      adminApiFetch<GivingControl>("/admin/review/giving-control", {
        method: "PATCH",
        body: JSON.stringify({
          paused: !state.givingPaused,
          expectedVersion: state.givingVersion,
          reason: reason.trim(),
          confirmation,
        }),
      }),
    onSuccess: (state) => {
      client.setQueryData(givingControlQuery.queryKey, state);
      void client.invalidateQueries({ queryKey: ["admin", "activity"] });
      void client.invalidateQueries({ queryKey: ["giving-status"] });
      void client.invalidateQueries({ queryKey: ["checkout"] });
      setOpen(false);
      setReason("");
      setConfirmation("");
    },
    onError: () => void query.refetch(),
  });
  const command = (snapshot ?? query.data)?.givingPaused ? "RESUME" : "PAUSE";
  return (
    <section className="mt-8 max-w-4xl rounded-xl border border-red-200 bg-red-50/40 p-6">
      <h2 className="font-semibold">Emergency giving controls</h2>
      <p className="mt-2 text-sm text-muted-ink">
        Pausing stops new checkouts, automatic charges, pledge reminders and missed-pledge
        penalties. Payments already started can still complete. Payouts are not paused.
      </p>
      {query.isError ? (
        <AdminLoadError retry={() => void query.refetch()} />
      ) : query.data ? (
        <>
          <p className="my-4 text-sm font-medium">
            Giving is {query.data.givingPaused ? "paused" : "enabled"}.
          </p>
          {query.data.givingPauseReason && (
            <p className="mb-4 text-sm">Internal reason: {query.data.givingPauseReason}</p>
          )}
          <button
            className="giving-small-button"
            onClick={() => {
              mutation.reset();
              setSnapshot(query.data);
              setConfirmation("");
              setOpen(true);
            }}
          >
            {query.data.givingPaused ? "Resume giving" : "Pause all giving"}
          </button>
        </>
      ) : (
        <p className="mt-4 text-sm">Checking payment availability...</p>
      )}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!mutation.isPending) setOpen(value);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {command === "PAUSE" ? "Pause all giving?" : "Resume giving?"}
            </DialogTitle>
            <DialogDescription>
              {command === "PAUSE"
                ? "Already-started payments may complete. This change affects all donors immediately."
                : "Held cycles will be skipped. Automatic gifts restart with at least three days' notice; there will be no catch-up debits."}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (snapshot && confirmation === command && reason.trim().length >= 5)
                mutation.mutate(snapshot);
            }}
          >
            <fieldset disabled={mutation.isPending} className="space-y-4">
              <label className="giving-label">
                Reason for the audit log
                <textarea
                  required
                  minLength={5}
                  maxLength={1000}
                  className="giving-input"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </label>
              <label className="giving-label">
                Type {command} to confirm
                <input
                  required
                  autoComplete="off"
                  className="giving-input"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
              </label>
            </fieldset>
            {mutation.isError && (
              <p role="alert" className="text-sm text-red-700">
                {mutation.error.message}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="giving-small-button"
                disabled={mutation.isPending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="giving-small-button bg-black text-white"
                disabled={
                  mutation.isPending || confirmation !== command || reason.trim().length < 5
                }
              >
                {mutation.isPending ? "Saving..." : "Confirm"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
