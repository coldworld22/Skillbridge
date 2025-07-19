import api from "@/services/api/api";

export const fetchCurrencies = async () => {
  const { data } = await api.get("/currencies");
  return data?.data ?? [];
};

export const createCurrency = async (payload) => {
  const headers = payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
  const { data } = await api.post("/currencies", payload, { headers });
  return data?.data;
};

export const updateCurrency = async (id, payload) => {
  const headers = payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
  const { data } = await api.put(`/currencies/${id}`, payload, { headers });
  return data?.data;
};

export const deleteCurrency = async (id) => {
  await api.delete(`/currencies/${id}`);
};
