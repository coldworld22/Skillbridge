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

export const fetchPageList = async () => {
  const { data } = await api.get("/seo-config/pages");
  return data?.data ?? [];
};

export const uploadImage = async (file) => {
  const form = new FormData();
  form.append("image", file);
  const { data } = await api.post("/seo-config/upload-image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data?.url;
};
