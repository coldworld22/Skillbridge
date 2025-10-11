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
  if (!API_BASE) {
    const shouldProxy = uploadsPattern.test(relative) || normalized.startsWith("/api/");
    if (shouldProxy && !normalized.startsWith("/api/")) {
      return `/api${normalized}`;
    }
    return normalized;
  }
  return `${API_BASE}${normalized}`;
}

export function joinUrl(base, path) {
  return new URL(path, base).href;
}
