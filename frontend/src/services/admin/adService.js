import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";

export const createAd = async (payload) => {
  const { data } = await api.post("/ads/admin", payload, {
    headers: payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
  });
  return data?.data;
};

export const fetchAds = async () => {
  const { data } = await api.get("/ads");

  const ads = data?.data ?? [];
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
  return ads.map((ad) => ({
    ...ad,
    image: ad.image_url ? `${base}${ad.image_url}` : null,
    video: ad.video_url ? `${base}${ad.video_url}` : null,
    link: ad.link_url,
    targetRoles: ad.targetRoles ?? ad.target_roles ?? [],
  }));
};

export const fetchAdById = async (id) => {
  const { data } = await api.get(`/ads/${id}`);
  const ad = data?.data;
  if (!ad) return null;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
  return {
    ...ad,
    image: ad.image_url ? `${base}${ad.image_url}` : null,
    video: ad.video_url ? `${base}${ad.video_url}` : null,
    link: ad.link_url,
    targetRoles: ad.targetRoles ?? ad.target_roles ?? [],
  };
};

export const updateAd = async (id, payload) => {
  const { data } = await api.put(`/ads/${id}`, payload, {
    headers: payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
  });
  return data?.data;
};

export const deleteAd = async (id) => {
  await api.delete(`/ads/${id}`);
};

export const fetchAdAnalytics = async (id) => {
  const { data } = await api.get(`/ads/${id}/analytics`);
  return data?.data ?? null;
};
