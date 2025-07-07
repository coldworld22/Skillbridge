// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API Service – Axios Instance with Interceptors
// 📁 src/services/api/api.js

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


import axios from "axios";

// Fallback to localhost when the env var is missing
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

// Warn developers if the default localhost URL is used in production
if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_API_BASE_URL && window.location.hostname !== "localhost") {
  console.warn(
    "NEXT_PUBLIC_API_BASE_URL is not set. Using http://localhost:5000/api which will fail in production. Update frontend/.env.local"
  );
}

const api = axios.create({
  baseURL,
  withCredentials: true, // ✅ KEEP this to send cookies with requests
});

export default api;
