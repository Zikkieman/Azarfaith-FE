import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import { NotificationMenu } from "@/components/NotificationMenu";
import { useSidebar } from "./AdminNavigationContext";
import { AdminCommandPalette } from "./AdminCommandPalette";

export function AdminHeader({ title }: { title: string }) {
  const { setOpen } = useSidebar();
  const user = useAppSelector((state) => state.auth.user);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line-soft bg-paper/95 px-4 backdrop-blur-sm sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open admin navigation"
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 hover:bg-panel lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/admin" className="shrink-0 text-xs text-muted-ink">
          Admin
        </Link>
        <span className="text-line-input">/</span>
        <p className="truncate text-xs text-ink-soft">{title}</p>
      </div>
      <div className="flex items-center gap-2">
        <AdminCommandPalette />
        {user && <NotificationMenu userId={user.id} admin />}
      </div>
    </header>
  );
}
