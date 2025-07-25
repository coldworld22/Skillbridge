import { create } from "zustand";
import { getSystemErrors } from "@/services/errorLogService";

const useErrorLogStore = create((set) => ({
  logs: [],
  loading: false,
  fetch: async () => {
    set({ loading: true });
    try {
      const data = await getSystemErrors();
      set({ logs: data, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },
}));

export default useErrorLogStore;
