import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/features/catalog/api";
import { safeNotificationLink } from "@/lib/profile";

export function NotificationMenu({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const client = useQueryClient();
  const feed = useInfiniteQuery({
    queryKey: ["notifications", userId, "feed"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getNotifications({ page: pageParam, pageSize: 8 }),
    getNextPageParam: (page) =>
      page.page * page.pageSize < page.total ? page.page + 1 : undefined,
    staleTime: 0,
  });
  const unread = feed.data?.pages[0].unreadCount;
  const items = [
    ...new Map(
      feed.data?.pages.flatMap((page) => page.items).map((item) => [item.id, item]),
    ).values(),
  ];
  const read = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => client.invalidateQueries({ queryKey: ["notifications", userId] }),
    onError: (error: Error) => toast.error(error.message),
  });
  const readAll = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => client.invalidateQueries({ queryKey: ["notifications", userId] }),
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) void feed.refetch();
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-current/20"
        >
          <Bell className="h-4 w-4" />
          {unread !== undefined && unread > 0 && (
            <span className="absolute -right-1 -top-1 rounded-full bg-amber-500 px-1.5 text-[10px] leading-5 text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
          {feed.isError && (
            <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-[10px] text-white">
              !
            </span>
          )}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/10" />
        <Dialog.Content className="fixed right-3 top-[72px] z-[61] flex max-h-[50dvh] w-[calc(100vw-24px)] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-[#e9e6ef] bg-white text-[#130e30] shadow-xl">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#efedf3] p-4">
            <div>
              <Dialog.Title className="font-semibold">Notifications</Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-[#777283]">
                Updates from your giving and campaigns.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close notifications"
              className="rounded-lg p-1 hover:bg-gray-100"
            >
              <X size={18} />
            </Dialog.Close>
          </div>
          <div className="flex shrink-0 items-center justify-between px-4 py-3 text-xs">
            <Link
              to="/profile"
              hash="notifications"
              onClick={() => setOpen(false)}
              className="underline"
            >
              Preferences
            </Link>
            <button
              type="button"
              disabled={readAll.isPending || !unread || feed.isError}
              onClick={() => readAll.mutate()}
              className="font-semibold text-amber-700 disabled:opacity-40"
            >
              {readAll.isPending ? "Updating..." : "Mark all read"}
            </button>
          </div>
          <div
            className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-4"
            aria-busy={feed.isFetching}
          >
            {feed.isPending ? (
              <p role="status" className="py-6 text-sm">
                Getting notifications...
              </p>
            ) : feed.isError && !feed.data ? (
              <div role="alert">
                <p className="text-sm">Could not load your notifications.</p>
                <button className="giving-small-button mt-3" onClick={() => void feed.refetch()}>
                  Retry
                </button>
              </div>
            ) : (
              <>
                {feed.isError && (
                  <p role="alert" className="mb-3 text-sm text-red-700">
                    Could not refresh notifications.{" "}
                    <button className="underline" onClick={() => void feed.refetch()}>
                      Retry
                    </button>
                  </p>
                )}
                {!items.length && (
                  <p className="py-6 text-sm text-[#777283]">No notifications yet.</p>
                )}
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className={`rounded-xl border p-3 ${item.read ? "border-[#efedf3]" : "border-amber-200 bg-amber-50/50"}`}
                    >
                      <Link
                        to={safeNotificationLink(item.link) as "/"}
                        onClick={() => {
                          if (!item.read) read.mutate(item.id);
                          setOpen(false);
                        }}
                        className="block"
                      >
                        <p className="text-sm font-semibold">
                          {item.title}
                          {!item.read && (
                            <span className="ml-2 text-amber-600" aria-label="Unread">
                              •
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[#777283]">
                          {item.message}
                        </p>
                        <time
                          dateTime={item.createdAt}
                          className="mt-2 block text-[11px] text-[#777283]"
                        >
                          {new Date(item.createdAt).toLocaleString("en-NG", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </time>
                      </Link>
                      {!item.read && (
                        <button
                          type="button"
                          disabled={read.isPending}
                          onClick={() => read.mutate(item.id)}
                          className="mt-2 text-xs font-medium underline disabled:opacity-50"
                        >
                          Mark read
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {feed.hasNextPage && (
                  <button
                    type="button"
                    disabled={feed.isFetchingNextPage}
                    onClick={() => void feed.fetchNextPage()}
                    className="giving-small-button mt-3 w-full"
                  >
                    {feed.isFetchingNextPage ? "Getting more..." : "Load more"}
                  </button>
                )}
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
