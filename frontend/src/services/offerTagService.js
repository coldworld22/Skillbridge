import api from "@/services/api/api";

export const fetchOfferTags = async (search) => {
  const { data } = await api.get("/offers/tags", {
    params: search ? { search } : {},
  });
  return data?.data ?? [];
};

export const createOfferTag = async (payload) => {
  const { data } = await api.post("/offers/tags", payload);
  return data?.data;
};
