import api from "@/services/api/api";

// Initiate Bank Transfer
export const initiateBankPayment = async (payload) => {
  const config = payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  const { data } = await api.post("payments/bank/initiate", payload, config);
  return data?.data ?? data;
};

// Initiate crypto payment via NowPayments
export const initiateCryptoPayment = async (payload) => {
  const { data } = await api.post("payments/crypto/initiate", payload);
  return data?.data ?? data;
};

// Initiate Coinbase payment
export const initiateCoinbasePayment = async (payload) => {
  const { data } = await api.post("payments/coinbase/initiate", payload);
  return data?.data ?? data;
};

// Initiate PayPal payment
export const initiatePayPalPayment = async (payload) => {
  const { data } = await api.post("payments/paypal/create", payload);
  return data?.data ?? data;
};

// Initiate Stripe payment
export const initiateStripePayment = async (payload) => {
  const { data } = await api.post("payments/stripe/create", payload);
  return data?.data ?? data;
};

