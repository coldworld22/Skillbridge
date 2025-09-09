import api from "@/services/api/api";

export const clearCache = async () => {
  try {
    await api.post("/admin/cache/clear");
    toast.success(i18n.t("dashboard.cache_cleared"));
  } catch (err) {
    toast.error(i18n.t("dashboard.cache_clear_failed"));
    throw err;
  }
};
