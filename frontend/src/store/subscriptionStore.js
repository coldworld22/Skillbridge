import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchMySubscription } from "@/services/subscriptionService";

const selectActivePlan = (plans) => {
  if (!Array.isArray(plans) || plans.length === 0) return null;
  return plans.find((plan) => plan?.status === "active") || plans[0] || null;
};

const normalizePlans = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter(Boolean);
  return data ? [data] : [];
};

const useSubscriptionStore = create(
  persist(
    (set) => ({
      plan: null,
      plans: [],
      loading: false,
      async fetch(role) {
        set({ loading: true });
        try {
          const result = await fetchMySubscription(role);
          const plans = normalizePlans(result);
          set({
            plan: selectActivePlan(plans),
            plans,
            loading: false,
          });
        } catch (err) {
          set({ plan: null, plans: [], loading: false });
        }
      },
      clear: () => set({ plan: null, plans: [] }),
    }),
    { name: "subscription-store" }
  )
);

export default useSubscriptionStore;
