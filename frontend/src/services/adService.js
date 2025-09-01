import api from "@/services/api/api";
import { buildAdMediaUrl } from "@/utils/adMedia";

export const fetchAds = async ({ limit, offset } = {}, origin) => {
  const params = { ...(limit !== undefined ? { limit } : {}), ...(offset !== undefined ? { offset } : {}) };
  const config = Object.keys(params).length ? { params } : undefined;
  const { data } = await api.get("/ads", config);
  const ads = data?.data ?? [];
  const mapped = ads.map((ad) => ({
    ...ad,
    image: buildAdMediaUrl(ad.image_url, origin),
    video: buildAdMediaUrl(ad.video_url, origin),
    link: ad.link_url,
    adType: ad.ad_type ?? ad.adType,
  }));
  return { data: mapped, meta: data?.meta };
};
