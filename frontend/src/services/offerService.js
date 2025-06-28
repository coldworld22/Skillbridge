import api from "@/services/api/api";

export const fetchOffers = async () => {
  const { data } = await api.get("/offers");
  return data?.data ?? [];
};

export const createOffer = async (payload) => {
  const { data } = await api.post("/offers", payload);
  return data;
};
