// Base URL for the backend API. When this value includes the `/api` suffix
// (e.g. `http://localhost:5002/api`) we strip it for asset URLs so that
// generated paths like `/uploads/...` point to the correct server location.
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
// Remove any trailing "/api" segment (and anything following it) so that
// static asset URLs point to the server root regardless of API prefix.
const API_BASE = RAW_API_BASE.replace(/\/api.*$/, "");

export function safeEncodeURI(url) {
  if (!url) return url;
  // encodeURI keeps existing valid URL structure but safely escapes spaces,
  // parentheses and other characters that commonly break asset requests.
  return encodeURI(url).replace(/#/g, "%23");
}

export function buildUrl(path) {
  if (!path) return null;
  if (/^https?:/i.test(path)) return safeEncodeURI(path);
  // Normalize to root-relative
  const uploadsIndex = path.indexOf("/uploads");
  const rel = uploadsIndex !== -1 ? path.substring(uploadsIndex) : path;
  const normalized = rel.startsWith("/") ? rel : `/${rel}`;

  // Only prefix uploads with the API base so they proxy through Nginx/backend.
  if (/^\/uploads\//i.test(normalized)) {
    if (RAW_API_BASE) {
      const base = RAW_API_BASE.replace(/\/$/, "");
      return safeEncodeURI(`${base}${normalized}`); // e.g., https://domain/api/uploads/...
    }
    return safeEncodeURI(normalized.startsWith("/api/") ? normalized : `/api${normalized}`);
  }

  // For non-uploads (e.g., /images, /_next, other public assets), keep
  // root-relative so they resolve on the current origin and avoid accidental
  // cross-origin hosts if NEXT_PUBLIC_API_BASE_URL is misconfigured.
  return safeEncodeURI(normalized);
}

export function joinUrl(base, path) {
  return new URL(path, base).href;
}
