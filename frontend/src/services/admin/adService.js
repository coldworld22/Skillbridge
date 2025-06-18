import api from "@/services/api/api";

export const createAd = async (payload) => {
  const { data } = await api.post("/ads/admin", payload, {
    headers: payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
  });
  return data?.data;
};

export const fetchAds = async () => {
  const { data } = await api.get("/ads");

  const ads = data?.data ?? [];
  return ads.map((ad) => ({
    ...ad,
    image: `${process.env.NEXT_PUBLIC_API_BASE_URL}${ad.image_url}`,
    link: ad.link_url,
  }));
};

export const fetchAdById = async (id) => {
  const { data } = await api.get(`/ads/${id}`);
  const ad = data?.data;
  if (!ad) return null;
  return {
    ...ad,
    image: `${process.env.NEXT_PUBLIC_API_BASE_URL}${ad.image_url}`,
    link: ad.link_url,
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
