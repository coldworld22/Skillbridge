import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";

export const getAds = async () => {
  try {
    const { data } = await api.get("/ads");
    // Backend already filters out inactive ads so simply map the returned list.
    const ads = data?.data ?? [];

    // Build a fully-qualified base URL so media links resolve regardless of
    // whether NEXT_PUBLIC_API_BASE_URL is absolute ("https://api.com/api") or
    // relative ("/api"). When relative, fall back to the current origin and
    // retain the "/api" prefix so proxied media paths still work.
    let base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
    if (!base.startsWith("http") && typeof window !== "undefined") {
      base = window.location.origin + base;
    }
    base = base.replace(/\/$/, "");

    const formatUrl = (url) => {
      if (!url) return null;
      if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) {
        return url;
      }
      const path = url.startsWith("/") ? url : `/${url}`;
      return `${base}${path}`;
    };
    return ads.map((ad) => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      image: formatUrl(ad.image_url || ad.image),
      video: formatUrl(ad.video_url || ad.video),
      link: ad.link_url || ad.link,
    }));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to fetch ads", error);
    }
    return [];
  }
};
