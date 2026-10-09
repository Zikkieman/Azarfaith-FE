import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronRight, LogOut, Menu, Search, ArrowUpRight } from "lucide-react";
import { useApp } from "@/lib/store";
import { me } from "@/lib/mock";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "./context";

export type Crumb = { label: string; to?: string; params?: Record<string, string> };

const menuItem =
  "flex cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2.5 font-gsf text-sm text-ink focus:bg-panel";

/** Sticky top bar: breadcrumbs, search across everything, notifications and the account menu. */
export function AdminHeader({ crumbs = [] }: { crumbs?: Crumb[] }) {
  const { setOpen } = useSidebar();
  const setAuthed = useApp((s) => s.setAuthed);
  const setAdminRole = useApp((s) => s.setAdminRole);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-panel/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center gap-3 px-5 sm:px-8">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-paper lg:hidden"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>

        <nav
          aria-label="Breadcrumb"
          className="hidden min-w-0 flex-1 items-center gap-1.5 text-sm sm:flex"
        >
          <Link to="/admin" className="text-muted-ink transition-colors hover:text-ink">
            Admin
          </Link>
          {crumbs.map((c, i) => (
            <Fragment key={`${c.label}-${i}`}>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-subtle" strokeWidth={2} />
              {c.to && i < crumbs.length - 1 ? (
                <Link
                  to={c.to as "/admin"}
                  params={c.params as never}
                  className="truncate text-muted-ink transition-colors hover:text-ink"
                >
                  {c.label}
                </Link>
              ) : (
                <span className="truncate font-medium text-ink">{c.label}</span>
              )}
            </Fragment>
          ))}
        </nav>
        <span className="flex-1 sm:hidden" />

        <AdminSearch />

        <Notifications />

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ink"
          >
            <img src={me.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-60 rounded-field border border-line-soft bg-paper p-1.5 shadow-[0_16px_48px_-16px_rgba(19,14,48,0.25)]"
          >
            <div className="px-3 pb-2 pt-1.5 font-gsf">
              <p className="text-sm font-semibold text-ink">{me.name}</p>
              <p className="text-[13px] text-muted-ink">Platform admin</p>
            </div>
            <DropdownMenuSeparator className="bg-line-soft" />
            <DropdownMenuItem asChild className={menuItem}>
              <Link to="/">
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} /> View website
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className={menuItem}
              onSelect={() => {
                setAdminRole(null);
                setAuthed(false);
                navigate({ to: "/" });
              }}
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

type Result = {
  id: string;
  kind: "Organization" | "Campaign" | "User";
  title: string;
  meta: string;
  image: string;
  round?: boolean;
  go: () => void;
};

/** Search organizations, campaigns and users from anywhere. Arrow keys move, Enter opens. */
function AdminSearch() {
  const orgs = useApp((s) => s.orgs);
  const campaigns = useApp((s) => s.campaigns);
  const users = useApp((s) => s.users);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  const results = useMemo<Result[]>(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    const hit = (...xs: string[]) => xs.some((x) => x.toLowerCase().includes(t));
    return [
      ...orgs
        .filter((o) => hit(o.name, o.location))
        .slice(0, 3)
        .map<Result>((o) => ({
          id: o.id,
          kind: "Organization",
          title: o.name,
          meta: o.location,
          image: o.photos[0],
          go: () => navigate({ to: "/admin/orgs/$id", params: { id: o.id } }),
        })),
      ...campaigns
        .filter((c) => hit(c.title, c.raiser.name, c.location))
        .slice(0, 3)
        .map<Result>((c) => ({
          id: c.id,
          kind: "Campaign",
          title: c.title,
          meta: c.raiser.name,
          image: c.cover,
          go: () => navigate({ to: "/admin/campaigns/$id", params: { id: c.id } }),
        })),
      ...users
        .filter((u) => hit(u.name, u.email))
        .slice(0, 3)
        .map<Result>((u) => ({
          id: u.id,
          kind: "User",
          title: u.name,
          meta: u.email,
          image: u.avatar,
          round: true,
          go: () => navigate({ to: "/admin/users/$id", params: { id: u.id } }),
        })),
    ];
  }, [q, orgs, campaigns, users, navigate]);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pick = (r: Result) => {
    r.go();
    setQ("");
    setOpen(false);
  };

  return (
    <div ref={box} className="relative hidden md:block">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink"
        strokeWidth={1.75}
      />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && results[active]) {
            pick(results[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
            e.currentTarget.blur();
          }
        }}
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="admin-search-results"
        aria-label="Search organizations, campaigns and users"
        placeholder="Search"
        className="h-10 w-64 rounded-field border border-line-soft bg-paper pl-9 pr-3 font-gsf text-sm text-ink transition-[width,border-color] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] placeholder:text-subtle focus:w-80 focus:border-ink focus:outline-none"
      />
      {open && q.trim() ? (
        <div
          id="admin-search-results"
          role="listbox"
          className="admin-rise absolute right-0 top-[calc(100%+8px)] z-50 w-96 overflow-hidden rounded-field border border-line-soft bg-paper p-1.5 font-gsf shadow-[0_24px_64px_-20px_rgba(19,14,48,0.3)]"
        >
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-ink">
              Nothing matches &ldquo;{q.trim()}&rdquo;
            </p>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.kind}-${r.id}`}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(r)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-left transition-colors",
                  i === active ? "bg-panel" : "",
                )}
              >
                <img
                  src={r.image}
                  alt=""
                  className={cn(
                    "h-8 w-8 shrink-0 object-cover",
                    r.round ? "rounded-full" : "rounded-[8px]",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{r.title}</span>
                  <span className="block truncate text-[12px] text-muted-ink">{r.meta}</span>
                </span>
                <span className="shrink-0 text-[12px] text-subtle">{r.kind}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function Notifications() {
  const notifications = useApp((s) => s.adminNotifications);
  const markAllRead = useApp((s) => s.markAllNotificationsRead);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Popover onOpenChange={(o) => (!o && unread > 0 ? markAllRead() : undefined)}>
      <PopoverTrigger
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        {unread > 0 ? (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-panel" />
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(360px,calc(100vw-32px))] rounded-field border border-line-soft bg-paper p-0 font-gsf shadow-[0_24px_64px_-20px_rgba(19,14,48,0.3)]"
      >
        <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
          <p className="text-sm font-semibold text-ink">Notifications</p>
          {unread > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="text-[13px] font-medium text-ink-soft hover:text-ink"
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
              <li key={n.id} className="border-b border-line-soft last:border-0">
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
                    <p className="mt-1 text-[12px] text-subtle">{n.createdAt}</p>
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
