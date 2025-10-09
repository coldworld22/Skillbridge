import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as authService from "@/services/auth/authService";
import { getFullProfile } from "@/services/profile/profileService";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import logger from "@/utils/logger";

let rehydrateSet;

const useAuthStore = create(
  persist(
    (set, get) => {
      rehydrateSet = set;
      return {
      user: null,
      accessToken: null,
      onboarding: null,
      hasHydrated: false,

      setUser: (userData) =>
        set({
          user: userData,
          onboarding: userData
            ? {
                profile_complete: userData.profile_complete,
                is_email_verified: userData.is_email_verified,
                complete:
                  Boolean(userData.profile_complete) &&
                  Boolean(userData.is_email_verified),
              }
            : null,
        }),
      setToken: (token) => set({ accessToken: token }),
      markHydrated: () => set({ hasHydrated: true }),

      isAuthenticated: () => !!get().accessToken && !!get().user,

      login: async (credentials) => {
        logger.log("🔑 authStore.login invoked");
        const { accessToken, user, onboarding } = await authService.loginUser(credentials);
        if (user.avatar_url?.startsWith("blob:") || user.avatar_url === "null") {
          user.avatar_url = null;
        }
        set({
          accessToken,
          user,
          onboarding:
            onboarding ||
            {
              profile_complete: user.profile_complete,
              is_email_verified: user.is_email_verified,
              complete:
                Boolean(user.profile_complete) &&
                Boolean(user.is_email_verified),
            },
        });
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
          set({
            user,
            onboarding: {
              profile_complete: user.profile_complete,
              is_email_verified: user.is_email_verified,
              complete:
                Boolean(user.profile_complete) &&
                Boolean(user.is_email_verified),
            },
          });
          const fetchNotifications = useNotificationStore.getState().fetch;
          fetchNotifications?.();
          return user;
        } catch (err) {
          logger.error("❌ loginWithToken error", { message: err?.message });
          set({ accessToken: null, user: null, onboarding: null });
        }
      },

      refreshUser: async () => {
        try {
          const res = await getFullProfile();
          const fresh = res.data;
          if (fresh.avatar_url?.startsWith("blob:") || fresh.avatar_url === "null") {
            fresh.avatar_url = null;
          }
          set({
            user: fresh,
            onboarding: {
              profile_complete: fresh.profile_complete,
              is_email_verified: fresh.is_email_verified,
              complete:
                Boolean(fresh.profile_complete) &&
                Boolean(fresh.is_email_verified),
            },
          });
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
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth");
        }
        set({ accessToken: null, user: null, onboarding: null });
      },
    };
    },
    {
      name: "auth",
      onRehydrateStorage: () => {
        return (state) => {
          logger.log("🔥 Zustand hydrated");
          rehydrateSet?.({ hasHydrated: true });
        };
      },
    }
  )
);

export default useAuthStore;
