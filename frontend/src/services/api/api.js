// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API Service – Axios Instance with Interceptors
// 📁 src/services/api/api.js

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


import axios from "axios";
import logger from "@/utils/logger";

const isBrowser = typeof window !== "undefined";
const publicBaseCandidate = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
const internalBaseCandidate = process.env.INTERNAL_API_BASE_URL;
const LOCALHOST_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

const resolveBrowserDerivedBase = (candidate) => {
  if (!isBrowser) {
    return null;
  }

  try {
    const origin = window?.location?.origin;
    if (!origin) {
      return null;
    }

    return new URL(candidate, origin).toString();
  } catch (error) {
    logger.warn(
      `Failed to resolve API base URL from "${candidate}" against window.location.origin: ${error.message}`
    );
    return null;
  }
};

const pickBaseCandidate = () => {
  if (!isBrowser && internalBaseCandidate) {
    return internalBaseCandidate;
  }

  return publicBaseCandidate;
};

const isLocalHostname = (value) => {
  if (!value) {
    return false;
  }

  return LOCALHOST_HOSTNAMES.has(String(value).toLowerCase());
};

const ensureAbsoluteUrl = (candidate) => {
  if (!candidate) {
    return candidate;
  }

  if (/^https?:\/\//i.test(candidate)) {
    return candidate;
  }

  const tryResolveWithBase = (base) => {
    try {
      return new URL(candidate, base).toString();
    } catch (error) {
      logger.warn(
        `Failed to resolve API base URL from "${candidate}" against "${base}": ${error.message}`
      );
      return null;
    }
  };

  if (isBrowser) {
    const derivedFromOrigin = resolveBrowserDerivedBase(candidate);
    if (derivedFromOrigin) {
      logger.warn(
        `API base "${candidate}" is not absolute. Deriving fallback from window.location.origin: "${derivedFromOrigin}".`
      );
      return derivedFromOrigin;
    }

    const fallbackBrowserBase = [internalBaseCandidate]
      .filter((base) => base && /^https?:\/\//i.test(base))
      .shift();

    if (fallbackBrowserBase) {
      logger.warn(
        `API base "${candidate}" is not absolute. Falling back to "${fallbackBrowserBase}".`
      );
      return fallbackBrowserBase;
    }

    logger.warn(
      `API base "${candidate}" is not absolute and no fallback could be resolved. Using "${candidate}" as-is.`
    );

    return candidate;
  }

  const appDomain = process.env.APP_DOMAIN;
  if (appDomain) {
    const domainWithProtocol = /^https?:\/\//i.test(appDomain)
      ? appDomain
      : `https://${appDomain}`;
    const resolved = tryResolveWithBase(domainWithProtocol);
    if (resolved) {
      return resolved;
    }
  }

  const fallback = internalBaseCandidate && /^https?:\/\//i.test(internalBaseCandidate)
    ? internalBaseCandidate
    : candidate;

  logger.warn(
    `API base "${candidate}" is not absolute and could not be resolved. Falling back to "${fallback}".`
  );

  return fallback;
};

const ensureApiSuffix = (candidate) => {
  if (!candidate) {
    return candidate;
  }

  const trimmedCandidate = candidate.trim();

  if (/\/api\/?$/i.test(trimmedCandidate)) {
    return trimmedCandidate;
  }

  if (/^https?:\/\//i.test(trimmedCandidate)) {
    try {
      const url = new URL(trimmedCandidate);
      const normalisedPath = url.pathname.replace(/\/+$/, "");

      if (/\/api$/i.test(normalisedPath)) {
        return url.toString();
      }

      url.pathname = normalisedPath ? `${normalisedPath}/api` : "/api";
      return url.toString();
    } catch (error) {
      logger.warn(
        `Failed to append /api to API base URL "${trimmedCandidate}": ${error.message}`
      );
      return `${trimmedCandidate.replace(/\/+$/, "")}/api`;
    }
  }

  return `${trimmedCandidate.replace(/\/+$/, "")}/api`;
};

const ensureTrailingSlash = (candidate) => {
  if (!candidate) {
    return candidate;
  }

  if (/^https?:\/\//i.test(candidate)) {
    try {
      const url = new URL(candidate);
      url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;
      return url.toString();
    } catch (error) {
      logger.warn(
        `Failed to normalise API base URL trailing slash for "${candidate}": ${error.message}`,
      );
    }
  }

  return `${candidate.replace(/\/+$/, "")}/`;
};

const deriveBrowserApiBase = () => {
  if (!isBrowser) {
    return null;
  }

  try {
    const origin = window?.location?.origin;
    if (!origin) {
      return null;
    }

    return new URL("/api", origin).toString();
  } catch (error) {
    logger.warn(
      `Failed to derive API base from window.location.origin: ${error?.message || error}`
    );
    return null;
  }
};

const maybeReplaceLocalhostForBrowser = (candidate) => {
  if (!isBrowser || !candidate) {
    return candidate;
  }

  try {
    const candidateUrl = new URL(candidate);
    const candidateHost = candidateUrl.hostname;
    const browserHost = window?.location?.hostname;

    if (
      isLocalHostname(candidateHost) &&
      browserHost &&
      !isLocalHostname(browserHost)
    ) {
      const derived = deriveBrowserApiBase();
      if (derived) {
        logger.warn(
          `API base "${candidate}" targets localhost but the site is served from "${browserHost}". Falling back to "${derived}".`
        );
        return derived;
      }

      logger.warn(
        `API base "${candidate}" targets localhost but the site is served from "${browserHost}". Falling back to browser origin.`
      );
    }
  } catch (error) {
    logger.warn(
      `Failed to inspect API base URL "${candidate}": ${error?.message || error}`
    );
  }

  return candidate;
};

const selectedCandidate = ensureApiSuffix(pickBaseCandidate());
const absoluteCandidate = ensureAbsoluteUrl(selectedCandidate);
const browserSafeCandidate = maybeReplaceLocalhostForBrowser(absoluteCandidate);

const baseURL = ensureTrailingSlash(
  browserSafeCandidate || absoluteCandidate || selectedCandidate,
);

// Warn developers if the default domain URL is used in production
if (
  isBrowser &&
  !process.env.NEXT_PUBLIC_API_BASE_URL &&
  window.location.hostname !== "localhost"
) {
  logger.warn(
    `NEXT_PUBLIC_API_BASE_URL is not set. Falling back to "${baseURL}" derived from the current origin. Set this variable in frontend/.env.local to avoid unexpected network errors.`
  );
}

const api = axios.create({
  baseURL,
  withCredentials: true, // ✅ KEEP this to send cookies with requests
  xsrfCookieName: "csrfToken", // ensure axios reads our CSRF cookie
  xsrfHeaderName: "x-csrf-token", // and sends it in this header automatically
});

// Attach a response interceptor so we can inspect status codes centrally.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      error.statusMessage = "Please log in to continue";
    } else if (status && status >= 500) {
      error.statusMessage = "Server error. Please try again later.";
    }
    return Promise.reject(error);
  }
);

export default api;
