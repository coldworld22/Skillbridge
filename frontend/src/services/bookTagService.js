import api from "@/services/api/api";

export const fetchBookTags = async (search, config = {}) => {
  const { data } = await api.get("/books/tags", {
    params: search ? { search } : {},
    ...config,
  });
  return data?.data ?? [];
};

export const createBookTag = async (payload, config = {}) => {
  const { data } = await api.post("/books/tags", payload, config);
  return data?.data;
};

export default { fetchBookTags, createBookTag };
