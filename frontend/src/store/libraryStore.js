import { create } from "zustand";
import { fetchLibrary as apiFetchLibrary } from "@/services/libraryService";

const useLibraryStore = create((set) => ({
  items: [],
  loading: false,
  fetchLibrary: async () => {
    set({ loading: true });
    try {
      const items = await apiFetchLibrary();
      set({ items, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },
}));

export default useLibraryStore;

