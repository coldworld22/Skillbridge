import api from "@/services/api/api";

export const fetchSEOConfig = async () => {
  const { data } = await api.get("/seo-config");
  return data?.data ?? null;
};

export const updateSEOConfig = async (payload) => {
  const { data } = await api.put("/seo-config", payload);
  return data?.data;
};

export const regenerateSitemap = async () => {
  const { data } = await api.post("/seo-config/sitemap/regenerate");
  return data?.data;
};

export const scanMetaIssues = async () => {
  const { data } = await api.get("/seo-config/meta-scan");
  return data?.data;
};
