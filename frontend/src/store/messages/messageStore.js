import { create } from "zustand";
import { toast } from "react-toastify";
import { getMessages, markMessageAsRead } from "@/services/messageService";

const HOUR_MS = 60 * 60 * 1000;

const useMessageStore = create((set, get) => ({
  items: [],
  loading: false,
  poller: null,

  fetch: async (showAlert = false) => {
    set({ loading: true });
    try {
      const data = await getMessages();
      const filtered = data.filter(
        (m) => !(m.read && m.read_at && new Date() - new Date(m.read_at) > HOUR_MS)
      );
      const prevUnread = get().items.filter((m) => !m.read).length;
      const unread = filtered.filter((m) => !m.read).length;
      if (showAlert && unread > prevUnread) {
        toast.info(
          `You have ${unread - prevUnread} new message${
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
    const res = await markMessageAsRead(id);
    const readAt = res.read_at || new Date().toISOString();
    set((state) => ({
      items: state.items.map((m) =>
        m.id === id ? { ...m, read: true, read_at: readAt } : m,
      ),
    }));

    setTimeout(() => {
      set((state) => ({
        items: state.items.filter(
          (m) =>
            !(
              m.id === id &&
              m.read &&
              m.read_at &&
              new Date() - new Date(m.read_at) >= HOUR_MS
            ),
        ),
      }));
    }, HOUR_MS);
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

export default useMessageStore;
