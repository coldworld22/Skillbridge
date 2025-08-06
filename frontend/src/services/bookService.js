import api from "@/services/api/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const buildUrl = (path) => {
  if (!path) return null;
  if (/^https?:/i.test(path)) return path;
  const relative = path.startsWith("/uploads")
    ? path
    : path.substring(path.indexOf("/uploads"));
  return `${API_BASE}${relative}`;
};

const formatBook = (book) => ({
  ...book,
  cover_image_url: buildUrl(book?.cover_image_url),
  pdf_url: buildUrl(book?.pdf_url),
});

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
  const list = data?.data ? data.data.map(formatBook) : [];
  return {
    books: list,
    meta: data?.meta ?? {},
  };
};

export const fetchBook = async (id) => {
  const { data } = await api.get(`/books/${id}`);
  return data?.data ? formatBook(data.data) : null;
};

export const deleteBook = async (id) => {
  await api.delete(`/books/${id}`);
  return true;
};

export const updateBook = async (id, formData, onUploadProgress) => {
  const { data } = await api.put(`/books/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return data?.data ? formatBook(data.data) : null;
};

export const updateBookStatus = async (id, status) => {
  const { data } = await api.patch(`/books/${id}/status`, { status });
  return data?.data;
};

export default {
  fetchBooks,
  fetchBook,
  deleteBook,
  updateBook,
  updateBookStatus,
};
