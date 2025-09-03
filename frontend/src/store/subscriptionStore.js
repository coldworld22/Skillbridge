import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchMySubscription as fetchInstructorSubscription } from "@/services/instructor/subscriptionService";
import { fetchMySubscription as fetchStudentSubscription } from "@/services/student/subscriptionService";
import useAuthStore from "@/store/auth/authStore";

const useSubscriptionStore = create(
  persist(
    (set) => ({
      plan: null,
      loading: false,
      async fetch(role) {
        set({ loading: true });
        try {
          const userRole =
            (role || useAuthStore.getState().user?.role || "")?.toLowerCase();
          const service =
            userRole === "student"
              ? fetchStudentSubscription
              : fetchInstructorSubscription;
          const sub = await service();
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
