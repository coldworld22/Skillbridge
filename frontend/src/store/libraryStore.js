import { create } from "zustand";
import { fetchLibrary as apiFetchLibrary } from "@/services/libraryService";

const useLibraryStore = create((set) => ({
  items: [],
  loading: false,
  fetchLibrary: async () => {
    set({ loading: true });
    try {
      const items = await apiFetchLibrary();
      const activeItems = Array.isArray(items)
        ? items.filter((b) => b?.status === "active")
        : [];
      set({ items: activeItems, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },
}));

export default useLibraryStore;

