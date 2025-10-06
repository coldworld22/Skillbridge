import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as authService from "@/services/auth/authService";
import { getFullProfile } from "@/services/profile/profileService";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import logger from "@/utils/logger";

let authStoreApi;

const useAuthStore = create(
  persist(
    (set, get, api) => {
      authStoreApi = api;

      return {
        user: null,
        accessToken: null,
        hasHydrated: false,

        setUser: (userData) => set({ user: userData }),
        setToken: (token) => set({ accessToken: token }),
        markHydrated: () => set({ hasHydrated: true }),

        isAuthenticated: () => !!get().accessToken && !!get().user,

        login: async (credentials) => {
          logger.log("🔑 authStore.login invoked");
          const { accessToken, user } = await authService.loginUser(credentials);
          if (user.avatar_url?.startsWith("blob:") || user.avatar_url === "null") {
            user.avatar_url = null;
          }
          set({ accessToken, user });
          return user;
        },

        /**
         * Log in using an already issued access token.
         * Stores the token, fetches the profile and notifications.
         */
        loginWithToken: async (token) => {
          set({ accessToken: token });
          try {
            const res = await getFullProfile();
            let user = res.data;
            if (user.avatar_url?.startsWith("blob:") || user.avatar_url === "null") {
              user.avatar_url = null;
            }
            set({ user });
            const fetchNotifications = useNotificationStore.getState().fetch;
            fetchNotifications?.();
            return user;
          } catch (err) {
            logger.error("❌ loginWithToken error", { message: err?.message });
            set({ accessToken: null, user: null });
          }
        },

        refreshUser: async () => {
          try {
            const res = await getFullProfile();
            const fresh = res.data;
            if (fresh.avatar_url?.startsWith("blob:") || fresh.avatar_url === "null") {
              fresh.avatar_url = null;
            }
            set({ user: fresh });
            return fresh;
          } catch (err) {
            logger.error("❌ refreshUser error", { message: err?.message });
          }
        },

        register: async (data) => {
          await authService.registerUser(data);
        },

        logout: async (skipRequest = false) => {
          if (!skipRequest) {
            try {
              await authService.logoutUser();
            } catch (_) {}
          }

          // Stop polling intervals when logging out
          const notifStop = useNotificationStore.getState().stopPolling;
          const msgStop = useMessageStore.getState().stopPolling;
          notifStop?.();
          msgStop?.();
          authStoreApi?.persist?.clearStorage?.();
          set({ accessToken: null, user: null });
        },
      };
    },
    {
      name: "auth",
      partialize: (state) => ({
        user: state.user,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          logger.log("🔥 Zustand hydrated");
          authStoreApi?.setState({ hasHydrated: true });
        };
      },
    }
  )
);

export default useAuthStore;
