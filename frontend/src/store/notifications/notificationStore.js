import { create } from "zustand";
import { toast } from "react-toastify";
import { getNotifications, markNotificationAsRead } from "@/services/notificationService";

const DAY_MS = 24 * 60 * 60 * 1000;

const useNotificationStore = create((set, get) => ({
  items: [],
  loading: false,
  poller: null,

  fetch: async (showAlert = false) => {
    set({ loading: true });
    try {
      const data = await getNotifications();
      const filtered = data.filter(
        (n) => !(n.read && n.read_at && new Date() - new Date(n.read_at) > DAY_MS)
      );
      const prevUnread = get().items.filter((n) => !n.read).length;
      const unread = filtered.filter((n) => !n.read).length;
      if (showAlert && unread > prevUnread) {
        toast.info(
          `You have ${unread - prevUnread} new notification${
            unread - prevUnread > 1 ? "s" : ""
          }`
        );
      }
      set({ items: filtered, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    const res = await markNotificationAsRead(id);
    const readAt = res.read_at || new Date().toISOString();
    set((state) => ({
      items: state.items.map((n) =>
        n.id === id ? { ...n, read: true, read_at: readAt } : n
      ),
    }));

    setTimeout(() => {
      set((state) => ({
        items: state.items.filter(
          (n) =>
            !(
              n.id === id &&
              n.read &&
              n.read_at &&
              new Date() - new Date(n.read_at) >= DAY_MS
            )
        ),
      }));
    }, DAY_MS);
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
