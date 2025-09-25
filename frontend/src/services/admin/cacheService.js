import api from "@/services/api/api";
import { ensureCsrfToken } from "@/services/api/csrf";

export const clearCache = async () => {
  const headers = {};
  const csrfToken = await ensureCsrfToken();
  if (csrfToken) headers["x-csrf-token"] = csrfToken;

  const { data } = await api.post("/admin/cache/clear", null, { headers });
  return data;
};