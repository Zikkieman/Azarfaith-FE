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

/**
 * A destructive action that needs a reason. Common reasons are one click; "Other" asks for words.
 * The reason is kept in the activity log and, if ticked, emailed to them.
 */
export function AdminRejectDialog({
  open,
  onOpenChange,
  title,
  description,
  reasons = [],
  confirmLabel = "Reject",
  notifyLabel = "Email them the reason",
  consequences,
  onReject,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  reasons?: string[];
  confirmLabel?: string;
  notifyLabel?: string | null;
  consequences?: string[];
  onReject: (reason: string, notify: boolean) => void;
}) {
  const [choice, setChoice] = useState<string>("");
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const id = useId();
  const other = choice === "other" || reasons.length === 0;
  const reason = other ? note.trim() : [choice, note.trim()].filter(Boolean).join(". ");
  const valid = other ? note.trim().length > 0 : Boolean(choice);

  const close = (v: boolean) => {
    if (!v) {
      setChoice("");
      setNote("");
      setNotify(true);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        {reasons.length ? (
          <fieldset className="flex flex-col gap-1.5">
            <legend className={cn(labelClass, "pb-2")}>Reason</legend>
            {[...reasons, "other"].map((r) => (
              <label
                key={r}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-field border px-3.5 py-2.5 text-sm transition-colors",
                  choice === r ? "border-ink bg-panel" : "border-line-soft hover:border-line-input",
                )}
              >
                <input
                  type="radio"
                  name={id}
                  checked={choice === r}
                  onChange={() => setChoice(r)}
                  className="h-4 w-4 accent-ink"
                />
                {r === "other" ? "Something else" : r}
              </label>
            ))}
          </fieldset>
        ) : null}

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>
            {other ? "Reason" : "Add detail"}{" "}
            {!other ? <span className="font-normal text-muted-ink">(optional)</span> : null}
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={
              other
                ? "Say what's wrong and what they can do about it."
                : "Anything that helps them fix it."
            }
            className={cn(inputClass, "resize-none")}
          />
        </label>

        {consequences?.length ? (
          <ul className="flex flex-col gap-1 rounded-field bg-panel p-3.5 text-[13px] text-ink-soft">
            {consequences.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        ) : null}

        {notifyLabel ? (
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="h-4 w-4 accent-ink"
            />
            {notifyLabel}
          </label>
        ) : null}

        <DialogFooter>
          <button type="button" className={btn("secondary")} onClick={() => close(false)}>
            Cancel
          </button>
          <button
            type="button"
            className={btn("danger")}
            disabled={!valid}
            onClick={() => {
              onReject(reason, notify);
              close(false);
            }}
          >
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
