import api from "@/services/api/api";

export const fetchBookTags = async (search) => {
  const { data } = await api.get("/books/tags", { params: search ? { search } : {} });
  return data?.data ?? [];
};

export const createBookTag = async (payload) => {
  const { data } = await api.post("/books/tags", payload);
  return data?.data;
};

export default { fetchBookTags, createBookTag };
