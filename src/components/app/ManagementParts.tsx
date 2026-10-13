import type { ReactNode } from "react";
import { btn } from "@/components/app/btn";
import { Bone } from "@/components/app/Skeletons";

// The designer dashboard's Panel recipe, reused for the additional owner workspace.
export function ManagementPanel({
  title,
  action,
  children,
  id,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="overflow-hidden rounded-card border border-line-soft">
      <div className="flex items-center justify-between border-b border-line-soft px-5 py-3.5">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ManagementEmpty({ children }: { children: ReactNode }) {
  return <p className="px-5 py-10 text-center text-sm text-muted-ink">{children}</p>;
}

export function ManagementLoading({ label = "Fetching your saved work..." }: { label?: string }) {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4 p-5">
      <span className="sr-only">{label}</span>
      <Bone className="h-5 w-3/4" />
      <Bone className="h-4 w-1/2" />
      <Bone className="h-9 w-28 rounded-full" />
    </div>
  );
}

export function ManagementError({
  message,
  retry,
  pending = false,
}: {
  message: string;
  retry: () => void;
  pending?: boolean;
}) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 p-5">
      <p className="text-sm text-danger">{message}</p>
      <button type="button" className={btn("secondary", "sm")} disabled={pending} onClick={retry}>
        {pending ? "Trying again..." : "Try again"}
      </button>
    </div>
  );
}
