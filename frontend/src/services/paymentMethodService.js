import api from "@/services/api/api";

export const fetchPaymentMethods = async () => {
  const { data } = await api.get("/payment-methods");
  return data?.data ?? [];
};

export const fetchStripePublicKey = async () => {
  const { data } = await api.get("/payment-methods/stripe/public-key");
  return data?.data?.publicKey ?? null;
};

export const fetchCoinbaseApiKey = async () => {
  const { data } = await api.get("/payment-methods/coinbase/api-key");
  return data?.data?.apiKey ?? null;
};
