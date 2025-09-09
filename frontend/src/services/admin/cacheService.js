import api from "@/services/api/api";

export const clearCache = async () => {
  try {
    await api.post("/admin/cache/clear");
  } catch (err) {
    throw err;
  }
};
