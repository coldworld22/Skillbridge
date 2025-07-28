import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchSEOConfig } from "@/services/admin/seoConfigService";

const useSEOConfigStore = create(
  persist(
    (set, get) => ({
      settings: {},
      loading: false,
      loaded: false,
      fetch: async () => {
        if (get().loading) return;
        set({ loading: true });
        try {
          const data = await fetchSEOConfig();
          set({ settings: data || {}, loaded: true, loading: false });
        } catch (_err) {
          set({ loaded: true, loading: false });
        }
      },
      update: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      clear: () => set({ settings: {}, loaded: false })
    }),
    { name: "seo-config" }
  )
);

export default useSEOConfigStore;
