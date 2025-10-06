import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";
import { toast } from "react-toastify";

export const fetchAds = async ({ role, limit, offset } = {}, config = {}) => {
  try {
    const params = {
      ...(role ? { role } : {}),
      ...(limit !== undefined ? { limit } : {}),
      ...(offset !== undefined ? { offset } : {}),
    };
    const hasParams = Object.keys(params).length > 0;
    const hasConfig = Object.keys(config).length > 0;
    const reqConfig = hasParams || hasConfig ? { ...config, ...(hasParams ? { params } : {}) } : undefined;
    const { data } = await api.get("ads", reqConfig);
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

    const mapped = ads.map((ad) => ({
      ...ad,
      image: formatUrl(ad.image_url || ad.image),
      video: formatUrl(ad.video_url || ad.video),
      link: ad.link_url || ad.link,
      adType: ad.ad_type ?? ad.adType,
    }));

    return { data: mapped, meta: data?.meta };
  } catch (error) {
    console.error("Failed to fetch ads", error);
    if (typeof window !== "undefined") {
      toast.error("Failed to load ads");
    }
    throw error;
  }
};

// Notify backend that an ad has been viewed
export const recordAdView = async (id) => {
  try {
    await api.post(`ads/${id}/view`);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to record ad view", error);
    }
  }
};

/**
 * Notify backend that an ad was clicked.
 * @param {number|string} id Identifier of the clicked ad
 */
export const recordAdClick = async (id) => {
  try {
    await api.post(`ads/${id}/click`);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to record ad click", error);
    }
  }
};
