import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getAppConfig } from "@/services/appConfigService";

const useAppConfigStore = create(
  persist(
    (set, get) => ({
      settings: {},
      loading: false,
      loaded: false,
      fetch: async () => {
        if (get().loading) return;
        set({ loading: true });
        try {
          const data = await getAppConfig();
          set({ settings: data, loaded: true, loading: false });
        } catch (err) {
          set({ loaded: true, loading: false });
        }
      },
      clear: () => set({ settings: {}, loaded: false }),
    }),
    { name: "app-config" }
  )
);

export default useAppConfigStore;
