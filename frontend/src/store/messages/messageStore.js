import { create } from "zustand";
import { toast } from "react-toastify";
import {
  getMessages,
  markMessageAsRead,
  deleteMessage as apiDeleteMessage,
} from "@/services/messageService";
const HOUR_MS = 60 * 60 * 1000;
// how often to poll for new messages
const POLL_INTERVAL_MS = 60000;

const useMessageStore = create((set, get) => ({
  items: [],
  loading: false,
  poller: null,

  fetch: async (showAlert = false) => {
    set({ loading: true });
    try {
      const data = await getMessages();
      const filtered = data.filter(
        (m) =>
          !(m.read && m.read_at && new Date() - new Date(m.read_at) > RETENTION_MS),
      );
      const prevUnread = get().items.filter((m) => !m.read).length;
      const unread = filtered.filter((m) => !m.read).length;
      if (showAlert && unread > prevUnread) {
        const diff = unread - prevUnread;
        if (diff === 1) {
          const msg = filtered.find((m) => !m.read);
          toast.info(`${msg.sender_name || "System"}: ${msg.message}`);
        } else {
          toast.info(`You have ${diff} new messages`);
        }
      }
      set({ items: filtered, loading: false });

    } catch (err) {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    const res = await markMessageAsRead(id);
    const readAt = res.read_at || new Date().toISOString();
    const idStr = String(id);
    set((state) => ({
      items: state.items.map((m) =>
        String(m.id) === idStr ? { ...m, read: true, read_at: readAt } : m,
      ),
    }));

    setTimeout(() => {
      set((state) => ({
        items: state.items.filter(
          (m) =>
            !(
              String(m.id) === idStr &&
              m.read &&
              m.read_at &&
              new Date() - new Date(m.read_at) >= RETENTION_MS
            ),
        ),
      }));
    }, RETENTION_MS);
  },

  delete: async (id) => {
    try {
      await apiDeleteMessage(id);
      const idStr = String(id);
      set((state) => ({
        items: state.items.filter((m) => String(m.id) !== idStr),
      }));
    } catch (_) {}
  },

  startPolling: () => {
    if (get().poller) return;

    const interval = setInterval(() => get().fetch(true), POLL_INTERVAL_MS);

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
