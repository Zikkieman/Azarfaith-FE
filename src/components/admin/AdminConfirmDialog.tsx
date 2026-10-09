import type { ReactNode } from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { btn } from "@/components/app/btn";

/**
 * Confirm one action and say exactly what it will do. `consequences` lists the knock-on effects
 * ("2 live campaigns pause") so nobody approves something they didn't mean to.
 */
export function AdminConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  consequences,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  confirmDisabled,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  consequences?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  confirmDisabled?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {consequences?.length ? (
          <div className="rounded-field bg-panel p-4">
            <p className="text-[12px] font-medium text-subtle">What happens</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {consequences.map((c) => (
                <li key={c} className="flex gap-2 text-sm text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-ink" strokeWidth={2} />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {children}
        <DialogFooter>
          <button type="button" className={btn("secondary")} onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={confirmDisabled}
            className={btn(variant === "destructive" ? "danger" : "primary")}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
