import api from "@/services/api/api";
import { buildUrl } from "@/utils/url";

export const formatBook = (book) => {
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

  let previewUrl = buildUrl(book?.preview_url);
  if (book?.allow_preview && !previewUrl && previewPages.length > 0) {
    previewUrl = previewPages[0];
  }

  const rawDownloadPath =
    book?.pdf_download_url || (book?.id ? `/api/books/${book.id}/pdf` : null);
  const resolvedDownloadUrl = buildUrl(rawDownloadPath);

  const formatted = {
    ...book,
    cover_image_url: buildUrl(book?.cover_image_url || book?.cover_image),
    cover_image: buildUrl(book?.cover_image) || book?.cover_image,
    coverUrl:
      buildUrl(book?.coverUrl) ||
      buildUrl(book?.cover_image_url || book?.cover_image) ||
      book?.coverUrl ||
      book?.cover_image_url ||
      book?.cover_image,
    pdf_url: buildUrl(book?.pdf_url),
    pdf_download_url: resolvedDownloadUrl,
    pdfDownloadUrl: resolvedDownloadUrl,
    preview_url: previewUrl,
    preview_pages: previewPages,
  };

  if (book?.price !== undefined && book?.price !== null) {
    formatted.price = Number(book.price);
  }

  if (!formatted.coverUrl) {
    formatted.coverUrl = "/images/default-book-cover.jpg";
  }
  if (!formatted.cover_image_url) {
    formatted.cover_image_url = formatted.coverUrl;
  }
  if (!formatted.cover_image) {
    formatted.cover_image = formatted.coverUrl;
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

// Re-export for testing and external usage
export { buildUrl };
