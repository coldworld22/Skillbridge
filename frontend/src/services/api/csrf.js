import api from "@/services/api/api";
import { getCookie } from "@/utils/cookies";

export const getCsrfToken = () => getCookie("csrfToken");

let cachedToken = null;

export const clearCachedCsrfToken = () => {
  cachedToken = null;
};

const fetchCsrfToken = async () => {
  try {
    // Use a relative URL so Axios appends it to the configured base URL.
    // A leading slash causes Axios to treat the path as absolute, which
    // skips the `/api` prefix in production and prevents the backend CSRF
    // route from being hit. That leaves the csrfToken cookie unset and the
    // next POST request fails with a 403. Using a relative path ensures we
    // always call `/api/csrf-token`, allowing the server to issue the
    // expected cookie before we retry the protected request.
    const response = await api.get("csrf-token", {
      params: { _: Date.now() },
      headers: { "Cache-Control": "no-cache" },
    });

    return response?.data?.token || getCsrfToken();
  } catch (e) {
    // The route may not exist; we only care about the cookie.
    return getCsrfToken();
  }
};

/**
 * Ensure a CSRF token cookie exists.
 * If absent (or a forced refresh is requested), performs a lightweight GET
 * request to trigger the server to set one, then returns the token.
 */
export const ensureCsrfToken = async ({ forceRefresh = false } = {}) => {
  if (!forceRefresh && cachedToken) {
    return cachedToken;
  }

  if (!forceRefresh) {
    const existingToken = getCsrfToken();
    if (existingToken) {
      cachedToken = existingToken;
      return cachedToken;
    }
  } else {
    clearCachedCsrfToken();
  }

  cachedToken = await fetchCsrfToken();
  return cachedToken;
};
