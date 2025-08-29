import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";
import { getCsrfToken } from "@/services/api/csrf";

export const createAd = async (payload) => {
  const headers = {};
  const csrfToken = getCsrfToken();
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  if (payload instanceof FormData) headers["Content-Type"] = "multipart/form-data";
  const { data } = await api.post("/ads/admin", payload, { headers });
  return data?.data;
};

export const checkAdTitle = async (title) => {
  const { data } = await api.get("/ads/admin/check-title", { params: { title } });
  return data?.data?.exists;
};

export const fetchAds = async () => {
  const { data } = await api.get("/ads/admin");

  const ads = data?.data ?? [];
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
  return ads.map((ad) => ({
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

export const updateAd = async (id, payload) => {
  const headers = {};
  const csrfToken = getCsrfToken();
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  if (payload instanceof FormData) headers["Content-Type"] = "multipart/form-data";
  const { data } = await api.put(`/ads/${id}`, payload, { headers });
  return data?.data;
};

export const deleteAd = async (id) => {
  const headers = {};
  const csrfToken = getCsrfToken();
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  await api.delete(`/ads/${id}`, { headers });
};

export const purchaseAd = async (id) => {
  const headers = {};
  const csrfToken = getCsrfToken();
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const { data } = await api.post(`/ads/${id}/purchase`, null, { headers });
  return data?.data;
};

export const fetchAdAnalytics = async (id) => {
  const { data } = await api.get(`/ads/${id}/analytics`);
  const res = data?.data || {};
  return {
    views: res.views ?? 0,
    ctr: res.ctr ?? 0,
    conversions: res.conversions ?? 0,
    reach: res.reach ?? 0,
    devices: res.devices ?? [],
    locationStats: res.locationStats ?? [],
    analytics: res.analytics ?? [],
  };
};
