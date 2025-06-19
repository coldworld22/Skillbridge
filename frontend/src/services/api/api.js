// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API Service – Axios Instance with Interceptors
// 📁 src/services/api/api.js

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


import axios from "axios";

const api = axios.create({
  // Default to port 5000 to mirror backend configuration
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true, // ✅ KEEP this to send cookies with requests
});

export default api;
