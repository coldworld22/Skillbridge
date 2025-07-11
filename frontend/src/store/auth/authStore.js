import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as authService from "@/services/auth/authService";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      hasHydrated: false,

      setUser: (userData) => set({ user: userData }),
      setToken: (token) => set({ accessToken: token }),
      markHydrated: () => set({ hasHydrated: true }),

      isAuthenticated: () => !!get().accessToken && !!get().user,

      login: async (credentials) => {
        console.log("🔑 authStore.login", credentials.email);
        const { accessToken, user } = await authService.loginUser(credentials);
        if (user.avatar_url?.startsWith("blob:") || user.avatar_url === "null") {
          user.avatar_url = null;
        }
        set({ accessToken, user });
        return user;
      },

      register: async (data) => {
        const { accessToken, user } = await authService.registerUser(data);
        if (user.avatar_url?.startsWith("blob:") || user.avatar_url === "null") {
          user.avatar_url = null;
        }
        set({ accessToken, user });
        return user;
      },

      logout: async () => {
        try {
          await authService.logoutUser();
        } catch (_) {}
        // Stop polling intervals when logging out
        const notifStop = useNotificationStore.getState().stopPolling;
        const msgStop = useMessageStore.getState().stopPolling;
        notifStop?.();
        msgStop?.();
        console.log(
          'Polling after logout:',
          useNotificationStore.getState().poller,
          useMessageStore.getState().poller
        );
        localStorage.removeItem("auth");
        set({ accessToken: null, user: null });
      },
    }),
    {
      name: "auth",
      onRehydrateStorage: () => {
        return (state) => {
          console.log("🔥 Zustand hydrated");
          set({ hasHydrated: true });
        };
      },
    }
  )
);

export default useAuthStore;
