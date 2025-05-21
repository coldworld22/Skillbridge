// src/services/api/api.js

import axios from "axios";
import { toast } from "react-toastify";
import useAuthStore from "@/store/auth/authStore";

// Create an Axios instance with default configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true, // Send cookies (used for refreshToken)
});

// Flags and queue to prevent multiple simultaneous token refreshes
let isRefreshing = false;
let failedQueue = [];

// Retry any queued requests after token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Attach a response interceptor to handle 401 errors (token expired)
api.interceptors.response.use(
  (response) => response, // Allow normal responses to pass through
  async (error) => {
    const originalRequest = error.config;
    const authStore = useAuthStore.getState();

    // Handle only 401 errors that haven't already been retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If another refresh is in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      // Begin token refresh flow
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.get("/auth/refresh-token", { withCredentials: true });
        authStore.setToken(data.accessToken);
        processQueue(null, data.accessToken);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        authStore.logout(); // Clear auth state

        // Notify user about auto logout
        toast.info("You have been logged out.");
        toast.error("Session expired. Please log in again.");

        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
