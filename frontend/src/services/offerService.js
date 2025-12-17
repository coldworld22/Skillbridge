import api from "@/services/api/api";

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (typeof value === "boolean") {
      query.set(key, value ? "true" : "false");
    } else {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
};

export const fetchOffers = async (params = {}, config = {}) => {
  const query = buildQueryString(params);
  const { data } = await api.get(`/offers${query}`, config);
  return data?.data ?? [];
};

export const createOffer = async (payload) => {
  const { data } = await api.post("/offers", payload);
  return data;
};

export const fetchOfferById = async (id, params = {}) => {
  const query = buildQueryString(params);
  const { data } = await api.get(`/offers/${id}${query}`);
  return data?.data ?? null;
};
