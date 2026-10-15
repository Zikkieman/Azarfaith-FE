import { Fragment, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronDown, ChevronRight, ChevronUp, Menu } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSidebar } from "./context";

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
  const queryClient = useQueryClient();
  const inbox = useQuery({
    queryKey: ["admin", "inbox"],
    queryFn: () => apiFetch<AdminInbox>("/admin/review/notifications/inbox?page=1&pageSize=20"),
    refetchInterval: 60_000,
  });
  const markAllRead = useMutation({
    mutationFn: (through: string) => apiFetch("/admin/review/notifications/read-all", { method: "PATCH", body: JSON.stringify({ through }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "inbox"] }),
  });
  const notifications = inbox.data?.items ?? [];
  const unread = inbox.data?.unreadCount ?? 0;

  return (
    <Popover>
      <PopoverTrigger
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative grid h-9 w-9 shrink-0 place-items-center rounded-[8px] text-ink transition-colors hover:bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(380px,calc(100vw-32px))] rounded-field border border-line-soft bg-paper p-0 font-gsf shadow-[0_24px_64px_-20px_rgba(19,14,48,0.3)]"
      >
        <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
          <p className="text-sm font-semibold text-ink">Notifications</p>
          {unread > 0 ? (
            <button
              type="button"
              onClick={() => inbox.data && markAllRead.mutate(inbox.data.asOf)}
              className="text-[13px] text-muted-ink transition-colors hover:text-ink"
            >
              Mark all as read
            </button>
          ) : null}
        </div>
        <ul className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-muted-ink">You're all caught up.</li>
          ) : (
            notifications.slice(0, 6).map((n) => (
              <li
                key={n.id}
                className={cn(
                  "border-b border-line-soft last:border-0",
                  !n.read && "bg-brand/[0.03]",
                )}
              >
                <div className="flex gap-3 px-4 py-3">
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      n.read ? "bg-transparent" : "bg-brand",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{n.title}</p>
                    <p className="mt-0.5 text-[13px] leading-5 text-ink-soft">{n.message}</p>
                    <p className="mt-1 text-[12px] text-subtle">
                      {new Date(n.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

type AdminInbox = {
  unreadCount: number;
  asOf: string;
  items: Array<{ id: string; title: string; message: string; createdAt: string; read: boolean }>;
};
