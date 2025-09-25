import api from "@/services/api/api";
import { ensureCsrfToken, getCsrfToken } from "@/services/api/csrf";

const requestClearCache = async (csrfToken) => {
  if (!csrfToken) {
    throw new Error("CSRF token unavailable");
  }

  const { data } = await api.post("/admin/cache/clear", null, {
    headers: { "x-csrf-token": csrfToken },
  });

  return data;
};

const prepareCsrfToken = async () => {
  await ensureCsrfToken();
  return getCsrfToken();
};

export const clearCache = async () => {
  try {
    const initialToken = await prepareCsrfToken();
    return await requestClearCache(initialToken);
  } catch (error) {
    if (error?.response?.status !== 403) {
      throw error;
    }

    const refreshedToken = await prepareCsrfToken();
    return requestClearCache(refreshedToken);
  }
};
