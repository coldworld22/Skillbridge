import api from "@/services/api/api";

export const fetchBooks = async ({
  page,
  perPage,
  filters = {},
  sort = {},
} = {}) => {
  const params = {
    ...(page !== undefined && { page }),
    ...(perPage !== undefined && { perPage }),
    ...filters,
    ...sort,
  };
  const { data } = await api.get("/books", { params });
  return {
    books: data?.data ?? [],
    meta: data?.meta ?? {},
  };
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
