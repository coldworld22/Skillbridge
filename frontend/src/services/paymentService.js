import api from "@/services/api/api";

// Initiate Bank Transfer
export const initiateBankPayment = async (payload) => {
  const { data } = await api.post("/payments/bank/initiate", payload);
  return data?.data ?? data;
};

// Initiate crypto payment via NowPayments
export const initiateCryptoPayment = async (payload) => {
  const { data } = await api.post("/payments/crypto/initiate", payload);
  return data?.data ?? data;
};

