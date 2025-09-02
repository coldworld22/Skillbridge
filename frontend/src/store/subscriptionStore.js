import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchMySubscription } from "@/services/instructor/subscriptionService";

const useSubscriptionStore = create(
  persist(
    (set) => ({
      plan: null,
      loading: false,
      async fetch() {
        set({ loading: true });
        try {
          const sub = await fetchMySubscription();
          set({ plan: sub || null, loading: false });
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
