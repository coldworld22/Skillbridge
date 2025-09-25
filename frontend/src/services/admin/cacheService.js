import api from "@/services/api/api";
export const clearCache = async () => {
  const { data } = await api.post("/admin/cache/clear");
  return data;
};