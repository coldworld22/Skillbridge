
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// This file sets up an Axios interceptor to handle token-based authentication
// 📁 src/services/api/tokenInterceptor.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import axios from "axios";
import api from "./api";
import { toast } from "react-toastify";
import Router from "next/router";
import useAuthStore from "@/store/auth/authStore";
import { ensureCsrfToken, clearCachedCsrfToken } from "@/services/api/csrf";
import logger from "@/utils/logger";

let isRefreshing = false;
let failedQueue = [];
let lastNetworkToast = 0;

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
  async (config) => {
    config.headers = config.headers ?? {};

    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    const method = config.method?.toLowerCase();
    if (["post", "put", "patch", "delete"].includes(method)) {
      try {
        const csrfToken = await ensureCsrfToken();
        if (csrfToken) {
          config.headers["x-csrf-token"] = csrfToken;
        }
      } catch (error) {
        logger.warn(
          `Failed to refresh CSRF token before ${method?.toUpperCase()} ${config?.url}: ${error?.message || error}`
        );
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

    const isCanceledRequest =
      error?.code === "ERR_CANCELED" ||
      error?.name === "CanceledError" ||
      error?.message?.toLowerCase() === "canceled";

    if (isCanceledRequest) {
      return Promise.reject(error);
    }

    if (
      axios.isCancel?.(error) ||
      error?.code === "ERR_CANCELED" ||
      error?.name === "CanceledError"
    ) {
      return Promise.reject(error);
    }

    if (
      (error.code === "ERR_NETWORK" || !error.response) &&
      Date.now() - lastNetworkToast > 5000
    ) {
      const failedUrl = error.config?.url;
      const errMsg = error.message;
      const logMessage = `Network error on ${failedUrl || "unknown endpoint"}: ${errMsg}`;
      logger.error(logMessage);
      toast.error(
        `${logMessage}. Check NEXT_PUBLIC_API_BASE_URL and backend CORS settings.`
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

      if (!hasAuthState) {
        logger.warn("\u26A0\uFE0F No auth state; treating as guest request");
        if (authStore.accessToken || authStore.user) {
          authStore.setToken?.(null);
          authStore.setUser?.(null);
        }
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

      const performRefreshRequest = async (forceCsrfRefresh = false) => {
        let csrfToken;
        try {
          csrfToken = await ensureCsrfToken(
            forceCsrfRefresh ? { forceRefresh: true } : undefined
          );
        } catch (csrfError) {
          logger.warn(
            `Failed to ensure CSRF token before refresh: ${csrfError?.message || csrfError}`
          );
        }

        return api.post(
          "auth/refresh",
          null,
          {
            withCredentials: true,
            headers: csrfToken ? { "x-csrf-token": csrfToken } : {},
          }
        );
      };

      const handleRefreshSuccess = async (data) => {
        logger.log("\u2705 Token refresh successful");
        authStore.setToken(data.accessToken);
        processQueue(null, data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      };

      const handleRefreshFailure = async (failureError) => {
        logger.error("\u274C Refresh token request failed:", failureError);
        processQueue(failureError, null);
        authStore.logout(true);
        toast.info("You have been logged out.");
        toast.error("Session expired. Please log in again.");
        if (typeof window !== "undefined") {
          Router.push("/auth/login");
        }
        return Promise.reject(failureError);
      };

      try {
        logger.log("\uD83D\uDD04 Attempting token refresh...");
        const { data } = await performRefreshRequest();
        return handleRefreshSuccess(data);
      } catch (refreshErr) {
        const refreshStatus = refreshErr?.response?.status;
        if (refreshStatus === 401 || refreshStatus === 403) {
          logger.warn(
            `\u26A0\uFE0F Refresh token request returned ${refreshStatus}. Forcing CSRF refresh and retrying once.`
          );
          try {
            clearCachedCsrfToken();
            const { data } = await performRefreshRequest(true);
            return handleRefreshSuccess(data);
          } catch (retryError) {
            return handleRefreshFailure(retryError);
          }
        }

        return handleRefreshFailure(refreshErr);
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
