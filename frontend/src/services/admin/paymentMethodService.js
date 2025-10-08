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
  const headers = payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
  const { data } = await api.post("/payment-methods/admin", payload, { headers });
  return data?.data;
};

export const updateMethod = async (id, payload) => {
  const headers = payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
  const { data } = await api.patch(`/payment-methods/admin/${id}`, payload, { headers });
  return data?.data;
};

export const deleteMethod = async (id) => {
  await api.delete(`/payment-methods/admin/${id}`);
  return true;
};

export const fetchPayPalCredentials = async () => {
  const { data } = await api.get("/payment-methods/admin/paypal/credentials");
  return data?.data ?? {};
};

export const updatePayPalCredentials = async (payload) => {
  const { data } = await api.put(
    "/payment-methods/admin/paypal/credentials",
    payload
  );
  return data?.data;
};

export const fetchStripeSettings = async () => {
  const { data } = await api.get("/payment-methods/admin/stripe/credentials");
  return data?.data ?? {};
};

export const updateStripeSettings = async (payload) => {
  const { data } = await api.put(
    "/payment-methods/admin/stripe/credentials",
    payload
  );
  return data?.data;
};

export const fetchCoinbaseSettings = async () => {
  const { data } = await api.get(
    "/payment-methods/admin/coinbase/credentials"
  );
  return data?.data ?? {};
};

export const updateCoinbaseSettings = async (payload) => {
  const { data } = await api.put(
    "/payment-methods/admin/coinbase/credentials",
    payload
  );
  return data?.data;
};
