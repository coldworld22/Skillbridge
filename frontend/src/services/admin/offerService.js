import api from "@/services/api/api";

export const fetchOffers = async () => {
  const { data } = await api.get("/offers");
  return data?.data ?? [];
};

export const fetchOfferById = async (id) => {
  const { data } = await api.get(`/offers/${id}`);
  return data?.data ?? null;
};

export const updateOffer = async (id, payload) => {
  const { data } = await api.put(`/offers/${id}`, payload);
  return data?.data;
};

export const deleteOffer = async (id) => {
  await api.delete(`/offers/${id}`);
};
