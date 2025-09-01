import { buildAdMediaUrl } from "@/utils/adMedia";

export const mapApiAdToClient = (ad, origin) => {
  return {
    ...ad,
    image: buildAdMediaUrl(ad.image_url, origin),
    video: buildAdMediaUrl(ad.video_url, origin),
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
};
