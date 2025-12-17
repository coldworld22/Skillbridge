import { API_BASE_URL } from "@/config/config";
import { ensureAdLifecycle } from "@/utils/ads/lifecycle";

export const mapApiAdToClient = (ad) => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
  const mapped = {
    ...ad,
    image: ad.image_url ? `${base}${ad.image_url}` : null,
    video: ad.video_url ? `${base}${ad.video_url}` : null,
    link: ad.link_url,
    targetRoles: ad.targetRoles ?? ad.target_roles ?? [],
    startAt: ad.start_at ?? ad.startAt,
    endAt: ad.end_at ?? ad.endAt,
    adType: ad.ad_type ?? ad.adType,
    priority: ad.priority ?? 0,
    allowBranding: ad.allow_branding ?? false,
    isActive: ad.is_active ?? ad.isActive ?? false,
    price: ad.price ?? 0,
    purchasedAt: ad.purchased_at ?? ad.purchasedAt ?? null,
    purchasedBy: ad.purchased_by ?? ad.purchasedBy ?? null,
  };
  return ensureAdLifecycle(mapped);
};
