// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API Service – Axios Instance with Interceptors
// 📁 src/services/api/api.js

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


import axios from "axios";
import logger from "@/utils/logger";

// If NEXT_PUBLIC_API_BASE_URL isn't provided, default to a relative path so
// the frontend works regardless of the domain it's served from. This prevents
// hard coded production URLs from causing CORS or redirect issues in other
// environments.
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

// Warn developers if the default domain URL is used in production
if (
  typeof window !== "undefined" &&
  !process.env.NEXT_PUBLIC_API_BASE_URL &&
  window.location.hostname !== "localhost"
) {
  logger.warn(
    "NEXT_PUBLIC_API_BASE_URL is not set. Using '/api'. Set this variable in frontend/.env.local to avoid unexpected network errors."
  );
}

const api = axios.create({
  baseURL,
  withCredentials: true, // ✅ KEEP this to send cookies with requests
  xsrfCookieName: "csrfToken", // ensure axios reads our CSRF cookie
  xsrfHeaderName: "x-csrf-token", // and sends it in this header automatically
});

export default api;
