import api from "@/services/api/api";

export const getLanguages = async () => {
  const { data } = await api.get("/languages");
  return data.data;
};

export const createLanguage = async (payload) => {
  const headers =
    payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
  const { data } = await api.post("/languages", payload, { headers });
  return data.data;
};

export const updateLanguage = async (id, payload) => {
  const headers =
    payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
  const { data } = await api.put(`/languages/${id}`, payload, { headers });
  return data.data;
};

export const deleteLanguage = async (id) => {
  await api.delete(`/languages/${id}`);
};
