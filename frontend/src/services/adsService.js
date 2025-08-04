import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";

export const getAds = async () => {
  try {
    const { data } = await api.get("/ads");
    // Backend already filters out inactive ads so simply map the returned list.
    const ads = data?.data ?? [];
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
    const apiBase = base.replace(/\/?api\/?$/, "");
    const formatUrl = (url) => {
      if (!url) return null;
      if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) {
        return url;
      }
      return `${apiBase}${url}`;
    };
    return ads.map((ad) => ({
      ...ad,
      image: formatUrl(ad.image_url),
      video: formatUrl(ad.video_url),
      link: ad.link_url,
    }));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to fetch ads", error);
    }
    return [];
  }
};
