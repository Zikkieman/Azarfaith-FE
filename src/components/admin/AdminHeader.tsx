import { Fragment, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, ChevronUp, Menu } from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import { NotificationMenu } from "@/components/NotificationMenu";
import { cn } from "@/lib/utils";
import { useSidebar } from "./AdminNavigationContext";

export type Crumb = { label: string; to?: string; search?: Record<string, string> };
export type Pager = {
  index: number;
  total: number;
  prev?: { to: string; params: Record<string, string> };
  next?: { to: string; params: Record<string, string> };
};

/** Thin top bar: breadcrumbs, a record stepper on detail pages, notifications. */
export function AdminHeader({ crumbs = [], pager }: { crumbs?: Crumb[]; pager?: Pager }) {
  const { setOpen } = useSidebar();
  const navigate = useNavigate();

  // J / K step through records like most review tools.
  useEffect(() => {
    if (!pager) return;
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof Element &&
        e.target.closest("input, textarea, select, [contenteditable], [role=dialog]")
      )
        return;
      const dest = e.key === "j" ? pager.next : e.key === "k" ? pager.prev : undefined;
      if (dest) navigate({ to: dest.to as "/admin", params: dest.params as never });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pager, navigate]);

  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-2 px-5 sm:px-8">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="-ml-2 grid h-9 w-9 place-items-center rounded-[8px] text-ink transition-colors hover:bg-panel lg:hidden"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>

        <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1 text-sm">
          {crumbs.length === 0 ? <span className="font-medium text-ink">Admin</span> : null}
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <Fragment key={`${c.label}-${i}`}>
                {i > 0 ? (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-subtle" strokeWidth={2} />
                ) : null}
                {c.to && !last ? (
                  <Link
                    to={c.to as "/admin"}
                    search={c.search as never}
                    className="shrink-0 rounded-[6px] px-1.5 py-1 text-muted-ink transition-colors hover:bg-panel hover:text-ink"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="truncate px-1.5 font-medium text-ink">{c.label}</span>
                )}
              </Fragment>
            );
          })}
        </nav>

        {pager ? (
          <div className="hidden items-center gap-1 sm:flex">
            <span className="pr-1 text-[13px] tabular-nums text-muted-ink">
              {pager.index} of {pager.total}
            </span>
            <StepButton label="Previous (K)" dest={pager.prev} icon="up" />
            <StepButton label="Next (J)" dest={pager.next} icon="down" />
          </div>
        ) : null}

        <Notifications />
      </div>
    </header>
  );
}

function StepButton({
  label,
  dest,
  icon,
}: {
  label: string;
  dest?: Pager["prev"];
  icon: "up" | "down";
}) {
  const Icon = icon === "up" ? ChevronUp : ChevronDown;
  const cls =
    "grid h-8 w-8 place-items-center rounded-[8px] border border-line-soft text-ink transition-colors";
  return dest ? (
    <Link
      to={dest.to as "/admin"}
      params={dest.params as never}
      aria-label={label}
      title={label}
      className={cn(cls, "hover:border-line-input hover:bg-panel")}
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
    </Link>
  ) : (
    <span aria-hidden className={cn(cls, "opacity-40")}>
      <Icon className="h-4 w-4" strokeWidth={2} />
    </span>
  );
}

function Notifications() {
  const user = useAppSelector((s) => s.auth.user);
  return user?.role === "platform_admin" ? (
    <NotificationMenu userId={user.id} admin appearance="designer-admin" />
  ) : null;
}
