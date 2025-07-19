import api from "@/services/api/api";

export const getLanguages = async () => {
  const { data } = await api.get("/languages");
  return data.data;
};

export const createLanguage = async (payload) => {
  const { data } = await api.post("/languages", payload);
  return data.data;
};

export const updateLanguage = async (id, payload) => {
  const { data } = await api.put(`/languages/${id}`, payload);
  return data.data;
};

export const deleteLanguage = async (id) => {
  await api.delete(`/languages/${id}`);
};
