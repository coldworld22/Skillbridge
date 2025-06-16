import api from "@/services/api/api";

export const fetchMethods = async () => {
  const { data } = await api.get("/payment-methods/admin");
  return data?.data ?? [];
};

export const fetchMethodById = async (id) => {
  const { data } = await api.get(`/payment-methods/admin/${id}`);
  return data?.data ?? null;
};

export const createMethod = async (payload) => {
  const { data } = await api.post("/payment-methods/admin", payload);
  return data?.data;
};

export const updateMethod = async (id, payload) => {
  const { data } = await api.patch(`/payment-methods/admin/${id}`, payload);
  return data?.data;
};

export const deleteMethod = async (id) => {
  await api.delete(`/payment-methods/admin/${id}`);
  return true;
};
