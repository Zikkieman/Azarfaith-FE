import type { ReactNode } from "react";

/** What a table or panel shows when nothing matches, with a way forward. */
export function AdminEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center font-gsf">
      {icon ? (
        <span className="mb-2 grid h-11 w-11 place-items-center rounded-full bg-panel text-ink-soft">
          {icon}
        </span>
      ) : null}
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted-ink">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
