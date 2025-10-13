import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getAppConfig } from "@/services/appConfigService";

// Avoid accessing localStorage on the server to keep SSR happy.
const isClient = typeof window !== "undefined";

const createAppConfigStore = (set, get) => ({
  settings: {},
  loading: false,
  loaded: false,
  fetch: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const data = await getAppConfig();
      set({ settings: data, loaded: true, loading: false });
    } catch (_err) {
      set({ loaded: true, loading: false });
    }
  },
  update: (newSettings) =>
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),
  clear: () => set({ settings: {}, loaded: false }),
});

const useAppConfigStore = create(
  isClient
    ? persist(createAppConfigStore, { name: "app-config" })
    : createAppConfigStore
);

export default useAppConfigStore;
