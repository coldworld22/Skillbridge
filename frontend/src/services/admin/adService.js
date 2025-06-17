import api from "@/services/api/api";

export const createAd = async (payload) => {
  const { data } = await api.post("/ads/admin", payload);
  return data?.data;
};

export const fetchAds = async () => {
  const { data } = await api.get("/ads");
  const ads = data?.data ?? [];
  return ads.map((ad) => ({
    ...ad,
    image: ad.image_url,
    link: ad.link_url,
  }));
};
