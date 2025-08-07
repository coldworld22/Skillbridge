import api from "@/services/api/api";

// Strip any trailing "/api" segment (with optional subpaths) so media URLs resolve correctly
const rawApiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const API_BASE = rawApiBase.replace(/\/api(?:\/.*)?$/, "");

export const buildUrl = (path) => {
  if (!path) return null;
  if (/^https?:/i.test(path)) return path;
  const base = API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
  const uploadsIndex = path.indexOf("/uploads");
  const relative = uploadsIndex !== -1 ? path.substring(uploadsIndex) : path;
  const normalized = relative.startsWith("/") ? relative : `/${relative}`;
  return `${base}${normalized}`;
};

const formatBook = (book) => ({
  ...book,
  cover_image_url: buildUrl(book?.cover_image_url || book?.cover_image),
  pdf_url: buildUrl(book?.pdf_url),
  preview_pages: Array.isArray(book?.preview_pages)
    ? book.preview_pages.map((p) => buildUrl(p))
    : typeof book?.preview_pages === "string" && book.preview_pages
    ? JSON.parse(book.preview_pages).map((p) => buildUrl(p))
    : [],
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

export const fetchBook = async (id, { admin = false } = {}) => {
  const endpoint = admin ? `/books/admin/${id}` : `/books/${id}`;
  const { data } = await api.get(endpoint);
  return data?.data ? formatBook(data.data) : null;
};

export const deleteBook = async (id) => {
  await api.delete(`/books/${id}`);
  return true;
};

export const createBook = async (formData, onUploadProgress) => {
  const { data } = await api.post("/books", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return data?.data ? formatBook(data.data) : null;
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
  return data?.data ? formatBook(data.data) : null;
};

export default {
  fetchBooks,
  fetchBook,
  deleteBook,
  createBook,
  updateBook,
  updateBookStatus,
};
