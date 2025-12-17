import api from "@/services/api/api";

export const fetchPaymentConfig = async () => {
  const { data } = await api.get("/payments/config");
  return data?.data ?? null;
};

export const updatePaymentConfig = async (payload) => {
  const { data } = await api.put("/payments/config", payload);
  return data?.data;
};
