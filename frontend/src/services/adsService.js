import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";

export const getAds = async () => {
  const { data } = await api.get("/ads");
  // Backend already filters out inactive ads so simply map the returned list.
  const ads = data?.data ?? [];
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
  return ads.map((ad) => ({
    ...ad,
    image: ad.image_url ? `${base}${ad.image_url}` : null,
    video: ad.video_url ? `${base}${ad.video_url}` : null,
    link: ad.link_url,
  }));
};
