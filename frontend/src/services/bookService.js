import api from "@/services/api/api";

// Determine the base URL for media assets. When an absolute API URL is
// provided (e.g. "https://example.com/api"), strip the trailing `/api` so that
// uploaded files resolve correctly. If a relative path like "/api" is used
// (common in local development where Next.js proxies API requests), we prefix
// media requests with that base so the proxy forwards them to the backend.
const rawApiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const API_BASE = rawApiBase.startsWith("http")
  ? rawApiBase.replace(/\/api(?:\/.*)?$/, "")
  : "";
const RELATIVE_API_BASE = !API_BASE && rawApiBase
  ? rawApiBase.replace(/\/$/, "")
  : "";

export const buildUrl = (path) => {
  if (!path) return null;
  if (/^https?:/i.test(path)) return path;
  const base = API_BASE || RELATIVE_API_BASE;
  let normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized.startsWith("/uploads")) {
    // Always convert legacy `/uploads` paths to the backend's `/media` endpoint
    // so that assets are consistently served via the media route regardless of
    // whether a base URL is configured. When a relative API base (e.g. `/api`)
    // is used, this path will be prefixed below so that the proxy forwards the
    // request correctly. Without a base, the application should still request
    // assets from `/media` rather than the deprecated `/uploads` path.
    normalized = normalized.replace("/uploads", "/media");
  }
  return base ? `${base}${normalized}` : normalized;
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
    preview_url: buildUrl(book?.preview_url),
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
  ...config
} = {}) => {
  const params = {
    ...(page !== undefined && { page }),
    ...(perPage !== undefined && { perPage }),
    ...filters,
    ...sort,
  };
  if (!admin && params.status === undefined) {
    params.status = "active";
  }
  const endpoint = admin ? "/books/admin" : "/books";
  const { data } = await api.get(endpoint, { params, ...config });
  const list = data?.data ? data.data.map(formatBook) : [];
  return {
    books: list,
    meta: data?.meta ?? {},
  };
};

export const fetchBook = async (id, { admin = false, ...config } = {}) => {
  const endpoint = admin ? `/books/admin/${id}` : `/books/${id}`;
  const hasConfig = Object.keys(config).length > 0;
  try {
    const { data } = hasConfig
      ? await api.get(endpoint, config)
      : await api.get(endpoint);
    return data?.data ? formatBook(data.data) : null;
  } catch (err) {
    // If the book doesn't exist, return null so callers can handle gracefully
    if (err?.response?.status === 404) return null;

    if (admin && err.name !== "CanceledError" && err.name !== "AbortError") {
      const { data } = hasConfig
        ? await api.get(`/books/${id}`, config)
        : await api.get(`/books/${id}`);
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
