import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchLibrary as apiFetchLibrary } from "@/services/libraryService";

const useLibraryStore = create(
  persist(
    (set) => ({
      books: [],
      isLoading: false,
      error: null,
      fetchLibrary: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiFetchLibrary();
          const activeBooks = Array.isArray(data)
            ? data.filter((b) => b?.status === "active")
            : [];
          set({ books: activeBooks, isLoading: false });
        } catch (err) {
          set({ error: err.message, isLoading: false });
        }
      },
      clear: () => set({ books: [] }),
    }),
    { name: "library-store" }
  )
);

export default useLibraryStore;
