import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame, ArrowRight, Bell, Menu, X } from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/features/catalog/api";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const authed = useAppSelector((state) => Boolean(state.auth.user));
  const path = useRouterState({ select: (s) => s.location.pathname });
  const primaryCta = authed ? ("/register-org" as const) : ("/signup" as const);
  const queryClient = useQueryClient();
  const { data: notificationsPage } = useQuery({
    queryKey: ["notifications", "nav"],
    queryFn: () => getNotifications({ page: 1, pageSize: 8 }),
    enabled: authed,
  });
  const notifications = notificationsPage?.items ?? [];
  const unreadCount = notificationsPage?.unreadCount ?? 0;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const navLink = (to: string, label: string) => (
    <Link
      to={to as "/"}
      className={`transition text-sm ${path === to ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 grid place-items-center">
            <Flame className="w-4 h-4 fill-white text-white" />
          </div>
          <span className="font-display text-lg tracking-tight">AzarFaith</span>
        </Link>

        <div className="hidden lg:flex items-center gap-7 text-sm">
          {authed ? (
            <>
              {navLink("/discover", "Discover")}
              {navLink("/create", "Start campaign")}
              {navLink("/manage", "Manage")}
              {navLink("/my-giving", "My giving")}
              {navLink("/profile", "Profile")}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((current) => !current)}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition hover:bg-muted"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </button>

                {notificationsOpen ? (
                  <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-border bg-background p-3 shadow-xl">
                    <div className="flex items-center justify-between gap-3 px-1 pb-2">
                      <div>
                        <p className="text-sm font-semibold">Notifications</p>
                        <p className="text-xs text-muted-foreground">Latest updates from your giving activity</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => markAllMutation.mutate()}
                        disabled={markAllMutation.isPending || unreadCount === 0}
                        className="text-xs font-medium text-amber-600 disabled:opacity-50"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="space-y-2">
                      {notifications.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <Link
                            key={notification.id}
                            to={(notification.link ?? "/profile") as "/"}
                            onClick={() => {
                              if (!notification.read) {
                                markReadMutation.mutate(notification.id);
                              }
                              setNotificationsOpen(false);
                            }}
                            className={`block rounded-xl border px-3 py-3 transition hover:border-amber-300 ${
                              notification.read ? "border-border bg-card" : "border-amber-200 bg-amber-50/50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium">{notification.title}</p>
                              {!notification.read ? (
                                <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {notification.message}
                            </p>
                            <p className="mt-2 text-[11px] text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleString("en-NG", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </p>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              {navLink("/discover", "Discover")}
              <Link
                to="/login"
                className={`transition text-sm ${path === "/login" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                Log in
              </Link>
            </>
          )}
          <Link
            to={primaryCta}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition"
          >
            Register org <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden w-10 h-10 grid place-items-center rounded-xl hover:bg-muted transition"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-border px-5 pb-5 pt-2 space-y-3 animate-in-up">
          <Link
            to="/discover"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm text-muted-foreground"
          >
            Discover
          </Link>
          {authed && (
            <>
              <Link
                to="/create"
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm text-muted-foreground"
              >
                Start campaign
              </Link>
              <Link
                to="/manage"
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm text-muted-foreground"
              >
                Manage
              </Link>
              <Link
                to="/my-giving"
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm text-muted-foreground"
              >
                My giving
              </Link>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm text-muted-foreground"
              >
                Profile
              </Link>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm text-muted-foreground"
              >
                Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
              </Link>
            </>
          )}
          {!authed && (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm text-muted-foreground"
            >
              Log in
            </Link>
          )}
          <Link
            to={primaryCta}
            onClick={() => setMenuOpen(false)}
            className="block w-full py-3 rounded-full bg-amber-500 text-white font-medium text-sm text-center"
          >
            Register your org
          </Link>
        </div>
      )}
    </nav>
  );
}
