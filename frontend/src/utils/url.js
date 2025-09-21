// Base URL for the backend API. When this value includes the `/api` suffix
// (e.g. `http://localhost:5002/api`) we strip it for asset URLs so that
// generated paths like `/uploads/...` point to the correct server location.
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
// Remove any trailing "/api" segment (and anything following it) so that
// static asset URLs point to the server root regardless of API prefix.
const API_BASE = RAW_API_BASE.replace(/\/api.*$/, "");

const ABSOLUTE_URL_REGEX = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//;

function isAbsoluteUrl(value) {
  return typeof value === "string" && ABSOLUTE_URL_REGEX.test(value);
}

function getFallbackOrigin() {
  if (typeof window !== "undefined" && window?.location?.origin) {
    return window.location.origin;
  }

  const internalBase = process.env.INTERNAL_API_BASE_URL;
  if (isAbsoluteUrl(internalBase)) {
    return new URL(internalBase).origin;
  }

  const publicBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (isAbsoluteUrl(publicBase)) {
    return new URL(publicBase).origin;
  }

  const appDomain = process.env.APP_DOMAIN;
  if (appDomain) {
    const isLocalhost = /^localhost(:\d+)?$/i.test(appDomain);
    const protocol = isLocalhost ? "http" : "https";
    return `${protocol}://${appDomain}`;
  }

  return null;
}

function joinPaths(base, path) {
  if (!base) {
    if (!path) return "";
    return path.startsWith("/") ? path : `/${path}`;
  }

  if (!path) {
    return base;
  }

  const baseEndsWithSlash = base.endsWith("/");
  const pathStartsWithSlash = path.startsWith("/");

  if (baseEndsWithSlash && pathStartsWithSlash) {
    return base + path.slice(1);
  }

  if (!baseEndsWithSlash && !pathStartsWithSlash) {
    return `${base}/${path}`;
  }

  return base + path;
}

export function safeEncodeURI(url) {
  return encodeURI(url).replace(/#/g, "%23");
}

export function buildUrl(path) {
  if (!path) return null;
  if (/^https?:/i.test(path)) return path;
  const uploadsIndex = path.indexOf("/uploads");
  const relative = uploadsIndex !== -1 ? path.substring(uploadsIndex) : path;
  const normalized = relative.startsWith("/") ? relative : `/${relative}`;
  return `${API_BASE}${normalized}`;
}

export function joinUrl(base, path) {
  if (!path) {
    return base || "";
  }

  if (isAbsoluteUrl(path)) {
    return path;
  }

  let effectiveBase = base;

  if (!isAbsoluteUrl(effectiveBase)) {
    const origin = getFallbackOrigin();
    if (origin) {
      const combined = joinPaths(effectiveBase, path);
      const normalizedPath = combined.startsWith("/")
        ? combined
        : `/${combined}`;
      return `${origin.replace(/\/+$/, "")}${normalizedPath}`;
    }

    return joinPaths(effectiveBase, path);
  }

  try {
    const baseForUrl =
      typeof effectiveBase === "string" && effectiveBase.length > 0
        ? effectiveBase.endsWith("/") || /[?#]$/.test(effectiveBase)
          ? effectiveBase
          : `${effectiveBase}/`
        : effectiveBase;

    return new URL(path, baseForUrl).href;
  } catch (error) {
    return joinPaths(effectiveBase, path);
  }
}
