import api from "@/services/api/api";

/**
 * Fetch recent system errors from the backend.
 * The request is made relative to `/api` so it works with any base URL.
 */
export const getSystemErrors = async () => {
  const res = await api.get("/system-errors");
  return res.data.data || res.data;
};
