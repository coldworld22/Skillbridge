// Base URL for the backend API. When this value includes the `/api` suffix
// (e.g. `http://localhost:5002/api`) we strip it for asset URLs so that
// generated paths like `/uploads/...` point to the correct server location.
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
// Remove any trailing "/api" segment (and anything following it) so that
// static asset URLs point to the server root regardless of API prefix.
const API_BASE = RAW_API_BASE.replace(/\/api.*$/, "");

export function safeEncodeURI(url) {
  return encodeURI(url).replace(/#/g, "%23");
}

export function buildUrl(path) {
  if (!path) return null;
  if (/^https?:/i.test(path)) return path;
  const uploadsPattern = /^\/?uploads\//i;
  const uploadsIndex = path.indexOf("/uploads");
  const relative = uploadsIndex !== -1 ? path.substring(uploadsIndex) : path;
  const normalized = relative.startsWith("/") ? relative : `/${relative}`;
  // Prefer routing uploads via the API prefix so Nginx setups that only proxy
  // `/api` still serve media correctly. When a public API base is available,
  // use RAW_API_BASE (which includes `/api`) for uploads to yield
  // `https://domain/api/uploads/...`.
  if (uploadsPattern.test(relative)) {
    if (RAW_API_BASE) {
      const base = RAW_API_BASE.replace(/\/$/, "");
      return `${base}${normalized}`; // e.g. https://domain/api/uploads/...
    }
    // No base configured: ensure `/api/uploads/...` so Next/Nginx rewrites pick it up
    return normalized.startsWith("/api/") ? normalized : `/api${normalized}`;
  }

  if (!API_BASE) {
    const shouldProxy = normalized.startsWith("/api/");
    if (shouldProxy) return normalized;
    return normalized;
  }
  return `${API_BASE}${normalized}`;
}

export function joinUrl(base, path) {
  return new URL(path, base).href;
}
