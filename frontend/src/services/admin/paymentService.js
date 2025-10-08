import api from "@/services/api/api";

export const fetchPayments = async () => {
  const { data } = await api.get("/payments/admin");
  return data?.data ?? [];
};

export const fetchPaymentById = async (id) => {
  const { data } = await api.get(`/payments/admin/${id}`);
  return data?.data ?? null;
};

export const createPayment = async (payload) => {
  const { data } = await api.post("/payments/admin", payload);
  return data?.data;
};

export const updatePayment = async (id, payload) => {
  const { data } = await api.patch(`/payments/admin/${id}`, payload);
  return data?.data;
};

export const deletePayment = async (id) => {
  await api.delete(`/payments/admin/${id}`);
  return true;
};
