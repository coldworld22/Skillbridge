import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { fetchLibrary as apiFetchLibrary } from "@/services/libraryService";

const createLibraryStore = (set) => ({
  books: [],
  loading: false,
  error: null,
  fetchLibrary: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetchLibrary();
      set({ books: Array.isArray(data) ? data : [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },
  clear: () => set({ books: [] }),
});

const isClient = typeof window !== "undefined";

const useLibraryStore = create(
  isClient
    ? persist(createLibraryStore, { name: "library-store" })
    : createLibraryStore
);

export default useLibraryStore;
