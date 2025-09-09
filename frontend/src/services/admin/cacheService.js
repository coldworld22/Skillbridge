import api from "@/services/api/api";

export const clearCache = () => api.post("/admin/cache/clear");
