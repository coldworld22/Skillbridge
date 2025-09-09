import api from "@/services/api/api";

export const clearCache = async () => {
  const response = await api.post("/admin/cache/clear");
  return response;
};
