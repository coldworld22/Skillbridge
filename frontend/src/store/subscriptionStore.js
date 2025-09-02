import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/services/api/api";

const useSubscriptionStore = create(
  persist(
    (set) => ({
      plan: null,
      loading: false,
      async fetch() {
        set({ loading: true });
        try {
          const { data } = await api.get("/subscriptions");
          const list = data?.data ?? data ?? [];
          const active = Array.isArray(list)
            ? list.find((s) => s.status === "active") || list[0] || null
            : list;
          set({ plan: active || null, loading: false });
        } catch (err) {
          set({ plan: null, loading: false });
        }
      },
      clear: () => set({ plan: null }),
    }),
    { name: "subscription-store" }
  )
);

export default useSubscriptionStore;
