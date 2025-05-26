import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as authService from "@/services/auth/authService";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      hasHydrated: false,

      setUser: (userData) => set({ user: userData }),

      login: async (credentials) => {
        const { accessToken, user } = await authService.loginUser(credentials);
        if (user.avatar_url?.startsWith("blob:")) user.avatar_url = null;
        set({ accessToken, user });
        return user;
      },

      register: async (data) => {
        const { accessToken, user } = await authService.registerUser(data);
        if (user.avatar_url?.startsWith("blob:")) user.avatar_url = null;
        set({ accessToken, user });
        return user;
      },

      logout: async () => {
        try {
          await authService.logoutUser();
        } catch (_) {}
        set({ accessToken: null, user: null });
      },

      setToken: (token) => set({ accessToken: token }),

      // ✅ Manual fallback to trigger hydration if needed
      markHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: "auth",
      onRehydrateStorage: () => {
        return (state) => {
          console.log("🔥 Zustand hydrated");
          set({ hasHydrated: true }); // 🔥 Ensure hydration flag gets set
        };
      },
    }
  )
);

export default useAuthStore;
