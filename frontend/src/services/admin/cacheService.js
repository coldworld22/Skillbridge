import api from "@/services/api/api";
import { toast } from "react-toastify";
import { i18n } from "next-i18next";

export const clearCache = async () => {
  try {
    await api.post("/cache/clear");
    toast.success(i18n.t("dashboard.cache_cleared"));
  } catch (err) {
    toast.error(i18n.t("dashboard.cache_clear_failed"));
    throw err;
  }
};
