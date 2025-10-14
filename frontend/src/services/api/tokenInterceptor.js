
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// This file sets up an Axios interceptor to handle token-based authentication
// 📁 src/services/api/tokenInterceptor.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import api from "./api";
import { toast } from "react-toastify";
import Router from "next/router";
import useAuthStore from "@/store/auth/authStore";
import { getCookie } from "@/utils/cookies";
import logger from "@/utils/logger";

let isRefreshing = false;
let failedQueue = [];
let lastNetworkToast = 0;

function hasPersistedAuthState() {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem("auth");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const state = parsed?.state || parsed;
    return Boolean(state?.accessToken || state?.user);
  } catch (_err) {
    return true;
  }
}

// Function to process the queue of failed requests
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Interceptor to add Authorization header with access token
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    const method = config.method?.toLowerCase();
    if (["post", "put", "patch", "delete"].includes(method)) {
      const csrfToken = getCookie("csrfToken");
      if (csrfToken) {
        config.headers["x-csrf-token"] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Interceptor to handle 401 Unauthorized errors and token refresh
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const authStore = useAuthStore.getState();
    
    // Ignore aborted/cancelled requests to avoid noisy toasts during route changes
    const isCanceled =
      error?.code === "ERR_CANCELED" ||
      error?.name === "CanceledError" ||
      error?.name === "AbortError" ||
      /cancell?ed/i.test(error?.message || "");

    if (
      !isCanceled &&
      (error.code === "ERR_NETWORK" || !error.response) &&
      Date.now() - lastNetworkToast > 5000
    ) {
      toast.error(
        "Network error: check NEXT_PUBLIC_API_BASE_URL and backend CORS settings."
      );
      lastNetworkToast = Date.now();
    }

    const isAuthRoute = [
      "/auth/login",
      "/auth/register",
      "/auth/refresh",
    ].some((route) => originalRequest?.url?.includes(route));

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      logger.warn("\u26A0\uFE0F Received 401 for", originalRequest?.url);
      const hasAuthState = !!authStore.accessToken || !!authStore.user;
      const hasPersistedState = hasPersistedAuthState();

      if (!hasAuthState && !hasPersistedState) {
        logger.warn("\u26A0\uFE0F No persisted auth state; redirecting to login");
        authStore.logout(true);
        if (typeof window !== "undefined") {
          Router.push("/auth/login");
        }
        toast.error("Session expired. Please log in again.");
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        logger.log("\uD83D\uDD04 Attempting token refresh...");
        const { data } = await api.post("/auth/refresh", null, {
          withCredentials: true,
        });
        logger.log("\u2705 Token refresh successful");
        authStore.setToken(data.accessToken);
        processQueue(null, data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        logger.error("\u274C Refresh token request failed:", refreshErr);
        processQueue(refreshErr, null);
        authStore.logout(true);
        toast.info("You have been logged out.");
        toast.error("Session expired. Please log in again.");
        if (typeof window !== "undefined") {
          Router.push("/auth/login");
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    } else if (error.response?.status === 401 && originalRequest._retry && !isAuthRoute) {
      authStore.logout(true);
      toast.info("You have been logged out.");
      toast.error("Session expired. Please log in again.");
      if (typeof window !== "undefined") {
        Router.push("/auth/login");
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);
