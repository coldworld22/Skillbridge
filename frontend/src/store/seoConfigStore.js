import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  fetchSEOConfig,
  regenerateSitemap,
  scanMetaIssues,
} from "@/services/admin/seoConfigService";

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
      regenerate: async () => {
        const result = await regenerateSitemap();
        if (result?.updated) {
          set((state) => ({
            settings: { ...state.settings, sitemapUpdated: result.updated },
          }));
        }
        return result;
      },
      scan: async () => {
        const result = await scanMetaIssues();
        if (result?.stats) {
          set((state) => ({
            settings: {
              ...state.settings,
              stats: result.stats,
              lastChecked: result.scannedAt,
            },
          }));
        }
        return result;
      },
      clear: () => set({ settings: {}, loaded: false })
    }),
    { name: "seo-config" }
  )
);

export default useSEOConfigStore;
