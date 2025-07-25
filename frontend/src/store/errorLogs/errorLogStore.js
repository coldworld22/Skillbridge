import { create } from "zustand";
import { getSystemErrors } from "@/services/errorLogService";

// how often to refresh the error log list
const POLL_INTERVAL_MS = 60000;

// Zustand store that keeps the latest error logs and polls the API

const useErrorLogStore = create((set, get) => ({
  logs: [],
  loading: false,
  poller: null,

  fetch: async () => {
    set({ loading: true });
    try {
      const data = await getSystemErrors();
      set({ logs: data, loading: false });
    } catch (err) {
      console.error('Failed to load system errors', err);
      set({ loading: false });
    }
  },

  startPolling: () => {
    if (get().poller) return;
    const interval = setInterval(() => get().fetch(), POLL_INTERVAL_MS);
    set({ poller: interval });
  },

  stopPolling: () => {
    if (get().poller) {
      clearInterval(get().poller);
      set({ poller: null });
    }
  },
}));

export default useErrorLogStore;
