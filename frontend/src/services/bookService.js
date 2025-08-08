import api from "@/services/api/api";

// Determine the base URL for media assets. If an absolute URL is provided
// (e.g. "https://example.com/api"), strip any trailing API segment so media
// files resolve correctly. For relative paths (like the default "/api" used
// during development), keep the prefix so requests are routed through the same
// proxy that handles API calls.
const rawApiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
const API_BASE = rawApiBase.startsWith("http")
  ? rawApiBase.replace(/\/api(?:\/.*)?$/, "")
  : rawApiBase;

export const buildUrl = (path) => {
  if (!path) return null;
  if (/^https?:/i.test(path)) return path;
  const base = API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
  const uploadsIndex = path.indexOf("/uploads");
  const relative = uploadsIndex !== -1 ? path.substring(uploadsIndex) : path;
  const normalized = relative.startsWith("/") ? relative : `/${relative}`;
  return `${base}${normalized}`;
};

const formatBook = (book) => {
  let previewPages = [];
  if (Array.isArray(book?.preview_pages)) {
    previewPages = book.preview_pages.map((p) => buildUrl(p));
  } else if (typeof book?.preview_pages === "string" && book.preview_pages) {
    try {
      previewPages = JSON.parse(book.preview_pages).map((p) => buildUrl(p));
    } catch {
      previewPages = [];
    }
  }

  const formatted = {
    ...book,
    cover_image_url: buildUrl(book?.cover_image_url || book?.cover_image),
    pdf_url: buildUrl(book?.pdf_url),
    preview_pages: previewPages,
  };

  if (book?.price !== undefined && book?.price !== null) {
    formatted.price = Number(book.price);
  }

  return formatted;
};

export const fetchBooks = async ({
  page,
  perPage,
  filters = {},
  sort = {},
  admin = false,
} = {}) => {
  const params = {
    ...(page !== undefined && { page }),
    ...(perPage !== undefined && { perPage }),
    ...filters,
    ...sort,
  };
  const endpoint = admin ? "/books/admin" : "/books";
  const { data } = await api.get(endpoint, { params });
  const list = data?.data ? data.data.map(formatBook) : [];
  return {
    books: list,
    meta: data?.meta ?? {},
  };
};

export const fetchBook = async (id, { admin = false } = {}) => {
  const endpoint = admin ? `/books/admin/${id}` : `/books/${id}`;
  try {
    const { data } = await api.get(endpoint);
    return data?.data ? formatBook(data.data) : null;
  } catch (err) {
    if (admin) {
      const { data } = await api.get(`/books/${id}`);
      return data?.data ? formatBook(data.data) : null;
    }
    throw err;
  }
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
