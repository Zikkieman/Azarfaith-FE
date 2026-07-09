import { create } from "zustand";

import {
  adminNotifications as notificationsSeed,
  type AdminNotification,
} from "./admin-mock";

type State = {
  adminNotifications: AdminNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
};

export const useApp = create<State>((set) => ({
  adminNotifications: notificationsSeed,
  markNotificationRead: (id) =>
    set((state) => ({
      adminNotifications: state.adminNotifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      adminNotifications: state.adminNotifications.map((notification) => ({
        ...notification,
        read: true,
      })),
    })),
}));
