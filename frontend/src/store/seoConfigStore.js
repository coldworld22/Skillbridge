import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "react-toastify";
import {
  fetchSEOConfig,
  regenerateSitemap,
  scanMetaIssues,
  fetchPageList,
} from "@/services/admin/seoConfigService";

const useSEOConfigStore = create(
  persist(
    (set, get) => ({
      settings: {},
      pages: [],
      loading: false,
      loaded: false,
      failed: false,
      error: null,
      retry: false,
      fetch: async () => {
        if (get().loading) return;
        set({ loading: true, error: null, failed: false });
        try {
          const data = await fetchSEOConfig();
          set({ settings: data || {}, loaded: true, loading: false, failed: false });
        } catch (err) {
          toast.error("Failed to load SEO settings");
          set({ loaded: false, loading: false, error: err.message });
        }
      },
      retry: async () => {
        if (get().error) {
          return get().fetch();
        }
      },
      retry: () => {
        if (get().loading) return;
        set({ loaded: false, failed: false });
        return get().fetch();
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
      fetchPages: async () => {
        try {
          const list = await fetchPageList();
          set({ pages: list });
        } catch (err) {
          toast.error("Failed to load page list");
          set({ pages: [], error: err.message });
        }
      },
      clear: () => set({ settings: {}, loaded: false, failed: false })
    }),
    { name: "seo-config" }
  )
);

export default useSEOConfigStore;
