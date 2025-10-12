import api from "@/services/api/api";
import { buildUrl } from "@/utils/url";

const normalizeArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) =>
      typeof item === "string" ? item.trim() : item
    )
    .filter((item) => item !== "" && item !== null && item !== undefined);
};

export const normalizeBookFilters = (filters = {}) => {
  return Object.entries(filters).reduce((acc, [key, value]) => {
    if (value === null || value === undefined) {
      return acc;
    }

    if (key === "priceRange") {
      const numeric = Number(value);
      if (Number.isFinite(numeric) && numeric > 0) {
        acc[key] = numeric;
      }
      return acc;
    }

    if (Array.isArray(value)) {
      const cleaned = normalizeArray(value);
      if (cleaned.length > 0) {
        acc[key] = cleaned;
      }
      return acc;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) {
        return acc;
      }
      acc[key] = trimmed;
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {});
};

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
  let rawCoverPath = coverCandidates.map(extractPath).find(Boolean);

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

  // If no explicit cover, fall back to first preview page image
  if (!rawCoverPath && previewPages.length > 0) {
    rawCoverPath = previewPages[0];
  }
  const normalizedCoverPath = buildUrl(rawCoverPath) || rawCoverPath;

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
  const normalizedFilters = normalizeBookFilters(filters);
  const normalizedSort = normalizeBookFilters(sort);
  const params = {
    ...(page !== undefined && { page }),
    ...(perPage !== undefined && { perPage }),
    ...normalizedFilters,
    ...normalizedSort,
  };
  if (!admin && params.status === undefined) {
    params.status = "active";
  }
  const endpoint = admin ? "/books/admin" : "/books";
  const requestConfig = Object.keys(params).length
    ? { params, ...config }
    : { ...config };
  const { data } = await api.get(endpoint, requestConfig);
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

export const downloadBookPdf = async (id, suggestedTitle) => {
  const res = await api.get(`/books/${id}/pdf`, { responseType: "blob" });
  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  try {
    const dispo = res.headers?.["content-disposition"] || res.headers?.["Content-Disposition"]; 
    let filename = null;
    if (typeof dispo === "string") {
      const match = dispo.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
      filename = decodeURIComponent(match?.[1] || match?.[2] || "").trim();
    }
    if (!filename) {
      const base = (suggestedTitle || "book").toString().trim() || "book";
      filename = base.replace(/[^a-z0-9_\-]+/gi, "_") + ".pdf";
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

export default {
  fetchBooks,
  fetchBook,
  deleteBook,
  createBook,
  updateBook,
  updateBookStatus,
  downloadBookPdf,
};

// Re-export for testing and external usage
export { buildUrl };
