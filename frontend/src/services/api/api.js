// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API Service – Axios Instance with Interceptors
// 📁 src/services/api/api.js

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


import axios from "axios";

// Fallback to production domain when the env var is missing
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://eduskillbridge.net/api";

// Warn developers if the default domain URL is used in production
if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_API_BASE_URL && window.location.hostname !== "eduskillbridge.net") {
  console.warn(
    "NEXT_PUBLIC_API_BASE_URL is not set. Using https://eduskillbridge.net/api which will fail in production if this domain is unavailable. Update frontend/.env.local"
  );
}

const api = axios.create({
  baseURL,
  withCredentials: true, // ✅ KEEP this to send cookies with requests
});

export default api;
