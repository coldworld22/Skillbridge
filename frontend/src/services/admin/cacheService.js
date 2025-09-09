import api from "@/services/api/api";

export const clearCache = async () => {
  await api.post("/admin/cache/clear");
};
