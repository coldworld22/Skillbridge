// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API Service – Axios Instance with Interceptors
// 📁 src/services/api/api.js

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


import axios from "axios";
import logger from "@/utils/logger";

// Resolve a safe API base URL for the browser.
// - Defaults to relative "/api" so Nginx can proxy on the same origin.
// - If a literal internal docker host (e.g. http://backend:5002) or localhost is
//   configured while the app runs on a public domain, fall back to "/api" to avoid
//   CORS/mixed-content errors in browsers.
function resolveBaseURL() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  let resolved = raw || "/api";

  if (typeof window === "undefined") return resolved;

  const host = window.location.hostname;
  const isLocalHost = host === "localhost" || host === "127.0.0.1";

  // If mixed-content would occur (site is https but base is http), prefer relative
  if (raw && /^http:/i.test(raw) && window.location.protocol === "https:") {
    logger.warn(
      "Configured NEXT_PUBLIC_API_BASE_URL is http while site is https; using '/api' to avoid mixed-content blocks."
    );
    return "/api";
  }

  try {
    const url = new URL(resolved, window.location.origin);
    const badHosts = new Set(["backend", "frontend", "nginx", "host.docker.internal"]);
    const isBadDockerHost = badHosts.has(url.hostname);
    const isLocalTarget = url.hostname === "localhost" || url.hostname === "127.0.0.1";

    if (!isLocalHost && (isBadDockerHost || isLocalTarget)) {
      logger.warn(
        `NEXT_PUBLIC_API_BASE_URL points to ${url.hostname} which is not reachable from the browser. Falling back to '/api'.`
      );
      return "/api";
    }

    // Keep absolute custom bases that look valid for the current environment
    return url.href.replace(/\/$/, "");
  } catch {
    // If not a valid absolute URL, assume relative is desired.
    return resolved;
  }
}

const api = axios.create({
  baseURL: resolveBaseURL(),
  withCredentials: true, // ✅ KEEP this to send cookies with requests
  xsrfCookieName: "csrfToken", // ensure axios reads our CSRF cookie
  xsrfHeaderName: "x-csrf-token", // and sends it in this header automatically
});

export default api;
