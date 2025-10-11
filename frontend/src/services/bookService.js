import api from "@/services/api/api";
import { buildUrl } from "@/utils/url";

export const formatBook = (book) => {
  const normalizeArrayInput = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Ignore JSON parse errors and fall back to comma split
      }
      if (trimmed.includes(",")) {
        return trimmed
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean);
      }
      return [trimmed];
    }
    return [];
  };

  const extractPath = (value) => {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
      for (const entry of value) {
        const resolved = extractPath(entry);
        if (resolved) return resolved;
      }
      return null;
    }
    if (typeof value === "object") {
      return (
        extractPath(value.url) ||
        extractPath(value.path) ||
        extractPath(value.href) ||
        extractPath(value.src) ||
        extractPath(value.file) ||
        null
      );
    }
    return null;
  };

  const collectPaths = (...inputs) => {
    const results = [];
    const visit = (value) => {
      if (!value) return;
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (typeof value === "string") {
        results.push(value);
        return;
      }
      if (typeof value === "object") {
        const resolved = extractPath(value);
        if (resolved) results.push(resolved);
      }
    };

    inputs.forEach((input) => {
      if (typeof input === "string") {
        normalizeArrayInput(input).forEach(visit);
      } else {
        visit(input);
      }
    });

    return results;
  };

  const coverCandidates = [
    book?.coverUrl,
    book?.cover_url,
    book?.cover_image_url,
    book?.coverImageUrl,
    book?.coverImage,
    book?.cover_image,
    book?.cover,
    book?.media?.cover,
    book?.media?.cover_image,
    book?.files?.cover,
    book?.files?.cover_image,
  ];
  const rawCoverPath = coverCandidates.map(extractPath).find(Boolean);
  const normalizedCoverPath = buildUrl(rawCoverPath) || rawCoverPath;

  const previewPagesRaw = collectPaths(
    book?.preview_pages,
    book?.previewPages,
    book?.preview_pages_urls,
    book?.previewPagesUrls,
    book?.previewImages,
    book?.files?.preview_pages,
    book?.files?.previewPages,
    book?.media?.previewPages,
  );
  const previewPages = previewPagesRaw
    .map((page) => buildUrl(page) || page)
    .filter(Boolean);

  const previewUrlCandidates = collectPaths(
    book?.preview_url,
    book?.previewUrl,
    book?.preview?.url,
    book?.previewFile,
  );
  let previewUrl = buildUrl(previewUrlCandidates[0]) || previewUrlCandidates[0];

  const allowPreview =
    book?.allow_preview ?? book?.allowPreview ?? book?.settings?.allowPreview;
  if (allowPreview && !previewUrl && previewPages.length > 0) {
    previewUrl = previewPages[0];
  }

  const pdfUrlCandidates = collectPaths(
    book?.pdf_url,
    book?.pdfUrl,
    book?.pdf_file,
    book?.file_url,
    book?.fileUrl,
    book?.media?.pdf,
    book?.files?.pdf,
    book?.files?.file,
  );
  const pdfUrl = buildUrl(pdfUrlCandidates[0]) || pdfUrlCandidates[0];

  const downloadCandidates = collectPaths(
    book?.pdf_download_url,
    book?.pdfDownloadUrl,
    book?.pdfDownloadURL,
    book?.download_url,
    book?.downloadUrl,
    book?.files?.download,
    book?.media?.download,
  );
  const rawDownloadPath =
    downloadCandidates[0] || (book?.id ? `/api/books/${book.id}/pdf` : null);
  const resolvedDownloadUrl = buildUrl(rawDownloadPath) || rawDownloadPath;

  const formatted = {
    ...book,
    cover_image_url: normalizedCoverPath,
    cover_image: normalizedCoverPath || rawCoverPath,
    coverUrl:
      normalizedCoverPath ||
      buildUrl(book?.coverUrl) ||
      buildUrl(book?.cover_image_url || book?.cover_image) ||
      book?.coverUrl ||
      book?.cover_image_url ||
      book?.cover_image,
    pdf_url: pdfUrl,
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

  if (!formatted.pdf_url) {
    formatted.pdf_url = null;
  }
  if (!formatted.pdf_download_url) {
    formatted.pdf_download_url = null;
  }
  if (!formatted.pdfDownloadUrl) {
    formatted.pdfDownloadUrl = formatted.pdf_download_url;
  }
  if (!formatted.preview_url) {
    formatted.preview_url = null;
  }
  if (!Array.isArray(formatted.preview_pages)) {
    formatted.preview_pages = [];
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
