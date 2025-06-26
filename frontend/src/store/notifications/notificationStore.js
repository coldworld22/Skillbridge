import { create } from "zustand";
import { getNotifications, markNotificationAsRead } from "@/services/notificationService";

const useNotificationStore = create((set) => ({
  items: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const data = await getNotifications();
      set({ items: data, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    await markNotificationAsRead(id);
    set((state) => ({
      items: state.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },
}));

export default useNotificationStore;
