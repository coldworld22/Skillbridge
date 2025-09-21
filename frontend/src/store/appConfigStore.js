import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getAppConfig } from "@/services/appConfigService";

let storeApi;

const useAppConfigStore = create(
  persist(
    (set, get, api) => {
      storeApi = api;
      return {
        settings: {},
        loading: false,
        loaded: false,
        hasHydrated: false,
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
      };
    },
    {
      name: "app-config",
      partialize: ({ hasHydrated, ...state }) => state,
      onRehydrateStorage: () => {
        return (_state, _error) => {
          storeApi?.setState({ hasHydrated: true });
        };
      },
    }
  )
);

export const selectAppConfigHasHydrated = (state) => state.hasHydrated;
export const useAppConfigHydrated = () =>
  useAppConfigStore(selectAppConfigHasHydrated);

export default useAppConfigStore;
