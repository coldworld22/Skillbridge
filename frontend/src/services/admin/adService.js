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
  return ads.map((ad) => {
    const imageUrl = ad.image_url.startsWith('http')
      ? ad.image_url
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}${ad.image_url}`;
    return {
      ...ad,
      image: imageUrl,
      link: ad.link_url,
    };
  });

};
