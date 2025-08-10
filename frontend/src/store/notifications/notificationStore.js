import { create } from "zustand";
import { toast } from "react-toastify";
import React from "react";
import LinkText from "@/components/shared/LinkText";
import i18next from "i18next";
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "@/services/notificationService";

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
          toast.info(i18next.t("you_have_new_notifications", { count: diff }));
        }
      }
      set({ items: filtered, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    const idStr = String(id);
    const prevItems = get().items;
    const tempReadAt = new Date().toISOString();

    // Optimistically update UI
    set((state) => ({
      items: state.items.map((n) =>
        String(n.id) === idStr ? { ...n, read: true, read_at: tempReadAt } : n,
      ),
    }));

    try {
      const res = await markNotificationAsRead(id);
      const readAt = res.read_at || tempReadAt;
      set((state) => ({
        items: state.items.map((n) =>
          String(n.id) === idStr ? { ...n, read_at: readAt } : n,
        ),
      }));

      setTimeout(() => {
        set((state) => ({
          items: state.items.filter(
            (n) =>
              !(
                String(n.id) === idStr &&
                n.read &&
                n.read_at &&
                new Date() - new Date(n.read_at) >= HOUR_MS
              ),
          ),
        }));
      }, HOUR_MS);

      return true;
    } catch (err) {
      // Revert on failure
      set({ items: prevItems });
      toast.error(i18next.t("failed_to_mark_notification_as_read"));
      return false;
    }
  },

  remove: async (id) => {
    await deleteNotification(id);
    const idStr = String(id);
    set((state) => ({
      items: state.items.filter((n) => String(n.id) !== idStr),
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
