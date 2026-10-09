import { useId, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { btn } from "@/components/app/btn";
import { inputClass, labelClass } from "@/components/app/AppShell";
import { cn } from "@/lib/utils";

/** A destructive action that needs a written reason (reject, revoke, suspend). */
export function AdminRejectDialog({
  open,
  onOpenChange,
  title,
  description = "Give a reason. It's shared with them and kept on record.",
  confirmLabel = "Reject",
  onReject,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onReject: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const id = useId();

  const close = (v: boolean) => {
    if (!v) setReason("");
    onOpenChange(v);
  };

  const submit = () => {
    if (!reason.trim()) return;
    onReject(reason.trim());
    close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <label htmlFor={id} className="flex flex-col gap-1.5">
          <span className={labelClass}>Reason</span>
          <textarea
            id={id}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. The registration certificate doesn't match the organization name."
            rows={4}
            autoFocus
            className={cn(inputClass, "resize-none")}
          />
        </label>
        <DialogFooter>
          <button type="button" className={btn("secondary")} onClick={() => close(false)}>
            Cancel
          </button>
          <button
            type="button"
            className={btn("danger")}
            onClick={submit}
            disabled={!reason.trim()}
          >
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
