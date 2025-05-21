import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as authService from "@/services/auth/authService"; // replace with your actual service

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      hasHydrated: false,
      
      markHydrated: () => set({ hasHydrated: true }),
      
      login: async (credentials, rememberMe = false) => {
        const { user, accessToken } = await authService.loginUser(credentials);
        set({ user, accessToken });
        localStorage.setItem("rememberMe", rememberMe ? "true" : "false");
        return user;
      },
      
      logout: async () => {
        set({ user: null, accessToken: null });
        const remember = localStorage.getItem("rememberMe") === "true";
        if (!remember) {
          localStorage.removeItem("auth-store");
        }
        localStorage.removeItem("rememberMe");
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
      onRehydrateStorage: () => (state) => {
        state.markHydrated?.();
      },
    }
  )
);

export default useAuthStore;
