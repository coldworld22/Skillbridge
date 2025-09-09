import { toast } from "react-toastify";
import { i18n } from "next-i18next";
import { clearCache as clearCacheService } from "@/services/admin/cacheService";

export async function clearCache() {
  try {
    await clearCacheService();
    toast.success(i18n.t("dashboard.cache_cleared"));
    return true;
  } catch (err) {
    console.error("Failed to clear cache", err);
    toast.error(i18n.t("dashboard.cache_clear_failed"));
    return false;
  }
}
