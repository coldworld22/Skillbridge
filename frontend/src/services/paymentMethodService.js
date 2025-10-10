import api from "@/services/api/api";

const normalizeSettings = (settings) => {
  if (!settings) return {};
  if (typeof settings === "string") {
    try {
      const parsed = JSON.parse(settings);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  if (typeof settings === "object") return settings;
  return {};
};

const normalizeMethod = (method = {}) => ({
  ...method,
  settings: normalizeSettings(method.settings),
});

export const fetchPaymentMethods = async () => {
  const { data } = await api.get("/payment-methods");
  const list = data?.data ?? [];
  return list.map(normalizeMethod);
};

export const fetchStripePublicKey = async () => {
  const { data } = await api.get("/payment-methods/stripe/public-key");
  return data?.data?.publicKey ?? null;
};

export const fetchCoinbaseApiKey = async () => {
  const { data } = await api.get("/payment-methods/coinbase/api-key");
  return data?.data?.apiKey ?? null;
};
