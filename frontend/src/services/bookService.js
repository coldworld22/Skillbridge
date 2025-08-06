import api from "@/services/api/api";

export const fetchBooks = async (params = {}) => {
  const { data } = await api.get("/books", { params });
  return data?.data ?? [];
};

export const fetchBook = async (id) => {
  const { data } = await api.get(`/books/${id}`);
  return data?.data;
};

export const deleteBook = async (id) => {
  await api.delete(`/books/${id}`);
  return true;
};

export default { fetchBooks, fetchBook, deleteBook };
