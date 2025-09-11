import api from "@/services/api/api";
import { getCookie } from "@/utils/cookies";

export const getCsrfToken = () => getCookie("csrfToken");

/**
 * Ensure a CSRF token cookie exists.
 * If absent, performs a lightweight GET request to trigger the server
 * to set one, then returns the newly acquired token.
 */
export const ensureCsrfToken = async () => {
  let token = getCsrfToken();
  if (!token) {
    try {
      await api.get("/csrf-token");
    } catch (e) {
      // The route may not exist; we only care about the cookie.
    }
    token = getCsrfToken();
  }
  return token;
};
