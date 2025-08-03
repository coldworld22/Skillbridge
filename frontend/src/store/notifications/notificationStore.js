import { create } from "zustand";
import { toast } from "react-toastify";
import React from "react";
import LinkText from "@/components/shared/LinkText";
import { getNotifications, markNotificationAsRead, deleteNotification } from "@/services/notificationService";

const HOUR_MS = 60 * 60 * 1000;

const useNotificationStore = create((set, get) => ({
  items: [],
  loading: false,
  poller: null,

  fetch: async (showAlert = false) => {
    set({ loading: true });
    try {
      const data = await getNotifications();
      const filtered = data.filter(
        (n) => !(n.read && n.read_at && new Date() - new Date(n.read_at) > HOUR_MS)
      );
      const prevUnread = get().items.filter((n) => !n.read).length;
      const unread = filtered.filter((n) => !n.read).length;
      if (showAlert && unread > prevUnread) {
        const diff = unread - prevUnread;
        if (diff === 1) {
          const note = filtered.find((n) => !n.read);
          toast.info(<LinkText text={note.message} />);
        } else {
          toast.info(`You have ${diff} new notifications`);
        }
      }
      set({ items: filtered, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    const res = await markNotificationAsRead(id);
    const readAt = res.read_at || new Date().toISOString();
    const numericId = Number(id);
    set((state) => ({
      items: state.items.map((n) =>
        Number(n.id) === numericId ? { ...n, read: true, read_at: readAt } : n,
      ),
    }));

    setTimeout(() => {
      set((state) => ({
        items: state.items.filter(
          (n) =>
            !(
              Number(n.id) === numericId &&
              n.read &&
              n.read_at &&
              new Date() - new Date(n.read_at) >= HOUR_MS
            ),
        ),
      }));
    }, HOUR_MS);
  },

  remove: async (id) => {
    await deleteNotification(id);
    set((state) => ({
      items: state.items.filter((n) => Number(n.id) !== Number(id)),
    }));
  },

  startPolling: () => {
    if (get().poller) return;
    const interval = setInterval(() => get().fetch(true), 60000);
    set({ poller: interval });
  },

  stopPolling: () => {
    if (get().poller) {
      clearInterval(get().poller);
      set({ poller: null });
    }
  },
}));

export default useNotificationStore;
