
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// This file sets up an Axios interceptor to handle token-based authentication
// 📁 src/services/api/tokenInterceptor.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import api from "./api";
import { toast } from "react-toastify";
import Router from "next/router";
import useAuthStore from "@/store/auth/authStore";

// Helper to read a cookie value in the browser
const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

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

    if (
      (error.code === "ERR_NETWORK" || !error.response) &&
      Date.now() - lastNetworkToast > 5000
    ) {
      toast.error(
        "Network error: check NEXT_PUBLIC_API_BASE_URL and backend CORS settings."
      );
      lastNetworkToast = Date.now();
    }

    const isAuthRoute =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      const refreshCookie = getCookie("refreshToken");
      const hasAuthState = !!authStore.accessToken || !!authStore.user;

      if (!refreshCookie && !hasAuthState) {
        authStore.setToken(null);
        authStore.setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth");
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
        const { data } = await api.post("/auth/refresh", null, {
          withCredentials: true,
        });
        authStore.setToken(data.accessToken);
        processQueue(null, data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        authStore.logout();
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
      authStore.logout();
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
