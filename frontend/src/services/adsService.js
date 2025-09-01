import api from "@/services/api/api";
import { buildAdMediaUrl } from "@/utils/adMedia";

export const getAds = async (role, { limit, offset } = {}, origin) => {
  try {
    const params = { ...((role && { role }) || {}), ...(limit !== undefined ? { limit } : {}), ...(offset !== undefined ? { offset } : {}) };
    const config = Object.keys(params).length ? { params } : undefined;
    const { data } = await api.get("/ads", config);
    // Backend already filters out inactive ads so simply map the returned list.
    const ads = data?.data ?? [];

    const mapped = ads.map((ad) => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      image: buildAdMediaUrl(ad.image_url || ad.image, origin),
      video: buildAdMediaUrl(ad.video_url || ad.video, origin),
      link: ad.link_url || ad.link,
    }));
    return { data: mapped, meta: data?.meta };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to fetch ads", error);
    }
    return { data: [], meta: {} };
  }
};

// Notify backend that an ad has been viewed
export const recordAdView = async (id) => {
  try {
    await api.post(`/ads/${id}/view`);
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
    await api.post(`/ads/${id}/click`);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to record ad click", error);
    }
  }
};
