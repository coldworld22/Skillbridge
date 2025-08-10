import api from "@/services/api/api";

export const fetchPaymentMethods = async () => {
  const { data } = await api.get("/payment-methods");
  return data?.data ?? [];
};

export const fetchPayPalClientId = async () => {
  const { data } = await api.get("/payment-methods/paypal/client-id");
  return data?.data?.clientId;
};
