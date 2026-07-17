import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Search, ChevronDown, LogOut, User, Menu } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { logout } from "@/features/auth/authSlice";
import { getAdminNotifications } from "@/features/catalog/api";
import { useSidebar } from "./AdminLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdminHeaderProps = {
  title: string;
};

export function AdminHeader({ title }: AdminHeaderProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { setOpen } = useSidebar();
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: adminNotifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: getAdminNotifications,
  });

  const notificationCount = adminNotifications.filter(
    (item) => item.kind === "organization_review" || item.kind === "campaign_review",
  ).length;
  const displayName = user?.fullName ?? "Platform Admin";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "A";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-sm px-4 sm:h-16 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="font-display text-lg font-bold text-gray-900 sm:text-xl">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search..."
            className="h-9 w-64 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <Bell className="h-4 w-4 text-gray-600" />
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                {Math.min(notificationCount, 9)}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-72 sm:w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">Notifications</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notificationsLoading ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-500">Loading notifications...</p>
                  ) : adminNotifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-500">No notifications</p>
                  ) : (
                    adminNotifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        className="border-b border-gray-50 px-4 py-3 transition-colors hover:bg-gray-50"
                      >
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{n.message}</p>
                        <p className="mt-1 text-[10px] text-gray-400">{n.relativeTime}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 hover:bg-gray-50 transition-colors">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={displayName} className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                {initials}
              </div>
            )}
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-gray-900">{displayName}</p>
              <p className="text-[10px] text-gray-500">Platform Admin</p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-gray-400 sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              className="gap-2"
              onClick={() => {
                navigate({ to: "/admin/profile" });
              }}
            >
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-red-600"
              onClick={async () => {
                await dispatch(logout());
              }}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
