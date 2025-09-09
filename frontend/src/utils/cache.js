import { clearCache as clearCacheService } from "@/services/admin/cacheService";

export async function clearCache() {
  try {
    await clearCacheService();
    return true;
  } catch (err) {
    console.error('Failed to clear cache', err);
    return false;
  }
}
