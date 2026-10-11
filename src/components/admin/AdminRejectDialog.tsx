import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type AdminRejectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onReject: (reason: string) => void;
  pending?: boolean;
  confirmLabel?: string;
  error?: string;
  minLength?: number;
};

export function AdminRejectDialog({
  open,
  onOpenChange,
  title,
  description = "Please provide a reason for this action.",
  onReject,
  pending = false,
  confirmLabel = "Reject",
  error,
  minLength = 1,
}: AdminRejectDialogProps) {
  const [reason, setReason] = useState("");

  const handleReject = () => {
    if (reason.trim().length >= minLength) {
      onReject(reason.trim());
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          aria-label="Decision reason"
          maxLength={1000}
          disabled={pending}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason..."
          rows={4}
          className="resize-none"
        />
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={pending || reason.trim().length < minLength}
          >
            {pending ? "Saving..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
