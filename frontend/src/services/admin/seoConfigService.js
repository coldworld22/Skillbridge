import api from "@/services/api/api";

export const fetchSEOConfig = async () => {
  const { data } = await api.get("/seo-config");
  return data?.data ?? null;
};

export const updateSEOConfig = async (payload) => {
  const { data } = await api.put("/seo-config", payload);
  return data?.data;
};
