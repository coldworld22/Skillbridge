import api from "@/services/api/api";
import { getCsrfToken } from "@/services/api/csrf";
import { mapApiAdToClient } from "./mapApiAdToClient";

export const createAd = async (payload, config = {}) => {
  const headers = {};
  const csrfToken = getCsrfToken();
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const { data } = await api.post("/ads/admin", payload, { headers });
  return data?.data;
};

export const checkAdTitle = async (title) => {
  const { data } = await api.get("/ads/admin/check-title", { params: { title } });
  return data?.data?.exists;
};

export const fetchAds = async ({
  limit,
  offset,
  role,
  status,
  type,
  search,
} = {}) => {
  try {
    const params = {
      ...(limit !== undefined ? { limit } : {}),
      ...(offset !== undefined ? { offset } : {}),
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(search ? { search } : {}),
    };
    const config = Object.keys(params).length ? { params } : undefined;
    const { data } = await api.get("/ads/admin", config);

    const ads = data?.data ?? [];
    const mapped = ads.map(mapApiAdToClient);
    return { data: mapped, meta: data?.meta };
  } catch (err) {
    if (err.response && err.response.status === 403) {
      return { data: [], meta: {} };
    }
    throw err;
  }
};

export const fetchAdById = async (id, headers = {}) => {
  try {
    const { data } = await api.get(`/ads/${id}`, { headers });
    const ad = data?.data;
    if (!ad) return null;
    return mapApiAdToClient(ad);
  } catch (err) {
    if (err.response && err.response.status === 403) {
      return null;
    }
    throw err;
  }
};

export const updateAd = async (id, payload, config = {}) => {
  const headers = {};
  const csrfToken = getCsrfToken();
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  try {
    const { data } = await api.put(`/ads/${id}`, payload, { headers, ...config });
    return data?.data;
  } catch (err) {
    if (err.response && err.response.status === 403) {
      return null;
    }
    throw err;
  }
};

export const deleteAd = async (id) => {
  const headers = {};
  const csrfToken = getCsrfToken();
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  try {
    await api.delete(`/ads/${id}`, { headers });
    return true;
  } catch (err) {
    if (err.response && err.response.status === 403) {
      return false;
    }
    throw err;
  }
};

export const purchaseAd = async (id) => {
  const headers = {};
  const csrfToken = getCsrfToken();
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  try {
    const { data } = await api.post(`/ads/${id}/purchase`, null, { headers });
    return data?.data;
  } catch (err) {
    if (err.response && err.response.status === 403) {
      return null;
    }
    throw err;
  }
};

export const fetchAdAnalytics = async (id, headers = {}) => {
  const { data } = await api.get(`/ads/${id}/analytics`, { headers });
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
