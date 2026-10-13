import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { btn } from "@/components/app/btn";
export function DesignSettingsSection({
  id,
  title,
  description,
  footer,
  danger,
  children,
}: {
  id: string;
  title: string;
  description: string;
  footer?: ReactNode;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 rounded-card border",
        danger ? "border-danger/25" : "border-line-soft",
      )}
    >
      <div className="px-5 pb-1 pt-5 sm:px-6">
        <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-ink">{description}</p>
      </div>
      <div className="flex flex-col gap-5 px-5 py-5 sm:px-6">{children}</div>
      {footer ? (
        <div className="flex items-center justify-end gap-3 border-t border-line-soft bg-panel/40 px-5 py-3 sm:px-6">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

export function DesignSaveFooter({
  pending,
  dirty,
  saved,
  discard,
  form,
  label = "Save changes",
  invalid,
}: {
  pending: boolean;
  dirty: boolean;
  saved?: boolean;
  discard?: () => void;
  form: string;
  label?: string;
  invalid?: boolean;
}) {
  return (
    <>
      {saved && !dirty ? (
        <span className="inline-flex items-center gap-1 text-[13px] text-verified-ink">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          Saved
        </span>
      ) : dirty && discard ? (
        <button
          type="button"
          disabled={pending}
          onClick={discard}
          className="text-[13px] text-muted-ink hover:text-ink"
        >
          Discard
        </button>
      ) : null}
      <button
        type="submit"
        form={form}
        disabled={pending || !dirty || invalid}
        className={btn("primary", "sm")}
      >
        {pending ? "Saving..." : label}
      </button>
    </>
  );
}
