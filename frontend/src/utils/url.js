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

function extractPathCandidate(path) {
  if (path == null) return null;

  if (typeof path === "string") {
    const trimmed = path.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof path === "number" || typeof path === "boolean") {
    return String(path);
  }

  if (path instanceof URL) {
    return path.toString();
  }

  if (Array.isArray(path)) {
    for (const value of path) {
      const candidate = extractPathCandidate(value);
      if (candidate) return candidate;
    }
    return null;
  }

  if (typeof path === "object") {
    if (typeof path.url === "string") return path.url;
    if (typeof path.href === "string") return path.href;
    if (typeof path.src === "string") return path.src;

    const preferredKeys = ["en", "default", "value", "path"];
    for (const key of preferredKeys) {
      const val = path[key];
      if (typeof val === "string" && val.trim()) {
        return val;
      }
    }

    for (const value of Object.values(path)) {
      const candidate = extractPathCandidate(value);
      if (candidate) return candidate;
    }
  }

  return null;
}

export function buildUrl(path) {
  const candidate = extractPathCandidate(path);
  if (!candidate) return null;

  if (/^https?:/i.test(candidate)) return safeEncodeURI(candidate);

  // Normalize to root-relative
  const uploadsIndex = candidate.indexOf("/uploads");
  const rel = uploadsIndex !== -1 ? candidate.substring(uploadsIndex) : candidate;
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
