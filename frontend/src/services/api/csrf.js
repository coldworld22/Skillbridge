import { getCookie } from "@/utils/cookies";

export const getCsrfToken = () => getCookie("csrfToken");

export const ensureCsrfTokenCookie = async (forceFetch = false) => {
  if (typeof window === "undefined") return true;
  if (!forceFetch) {
    const existing = getCsrfToken();
    if (existing) return true;
  }
  try {
    const res = await fetch("/api/csrf-token", {
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(`Failed to refresh CSRF token (${res.status})`);
    }
    // Best-effort parse so dev tools can inspect the token if needed. The client
    // primarily relies on the cookie the server sets, so we ignore parse errors.
    await res.json().catch(() => ({}));
    return true;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to refresh CSRF token", err);
    }
    return false;
  }
};
