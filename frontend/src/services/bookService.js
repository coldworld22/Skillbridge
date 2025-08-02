import api from "@/services/api/api";

export const fetchBooks = async () => {
  const { data } = await api.get("/books");
  return data?.data ?? [];
};

export const fetchBook = async (id) => {
  const { data } = await api.get(`/books/${id}`);
  return data?.data;
};

export default { fetchBooks, fetchBook };
