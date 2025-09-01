import { API_BASE_URL } from "@/config/config";

/**
 * Build a fully-qualified media URL for ad assets. When the configured base
 * URL is relative (e.g. "/api"), it will be prefixed with the current
 * origin in the browser or an optional `origin` provided on the server.
 * The base URL has any trailing slash removed before concatenating the path.
 *
 * @param {string|null|undefined} url Path or absolute URL to the media.
 * @param {string} [origin] Optional origin for server-side usage.
 * @returns {string|null} Fully-qualified media URL or null when input is falsy.
 */
export function buildAdMediaUrl(url, origin) {
  if (!url) return null;
  if (/^(?:https?:|blob:|data:)/.test(url)) return url;

  let base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL || "";

  if (base.startsWith("/")) {
    if (typeof window !== "undefined") {
      base = window.location.origin + base;
    } else if (origin) {
      base = origin + base;
    }
  }

  base = base.replace(/\/$/, "");

  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}
