import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";

export const fetchAds = async ({ limit, offset } = {}) => {
  const params = { ...(limit !== undefined ? { limit } : {}), ...(offset !== undefined ? { offset } : {}) };
  const config = Object.keys(params).length ? { params } : undefined;
  const { data } = await api.get("/ads", config);
  const ads = data?.data ?? [];
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
  const mapped = ads.map((ad) => ({
    ...ad,
    image: ad.image_url ? `${base}${ad.image_url}` : null,
    video: ad.video_url ? `${base}${ad.video_url}` : null,
    link: ad.link_url,
    adType: ad.ad_type ?? ad.adType,
  }));
  return { data: mapped, meta: data?.meta };
};
