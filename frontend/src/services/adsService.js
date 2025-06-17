import api from "@/services/api/api";

export const getAds = async () => {
  const { data } = await api.get("/ads");
  return data?.data ?? [];
};
