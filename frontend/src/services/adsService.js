import api from "@/services/api/api";

export const getAds = async () => {
  const { data } = await api.get("/ads");

  const ads = data?.data ?? [];
  return ads.map((ad) => ({
    ...ad,
    image: ad.image_url
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${ad.image_url}`
      : null,
    video: ad.video_url
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${ad.video_url}`
      : null,
    link: ad.link_url,
  }));
};
