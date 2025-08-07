import api from "@/services/api/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const buildUrl = (path) => {
  if (!path) return null;
  if (/^https?:/i.test(path)) return path;
  const uploadsIndex = path.indexOf("/uploads");
  const relative = uploadsIndex !== -1 ? path.substring(uploadsIndex) : path;
  const normalized = relative.startsWith("/") ? relative : `/${relative}`;
  return `${API_BASE}${normalized}`;
};

const formatBook = (book) => ({
  ...book,
  cover_image_url: buildUrl(book?.cover_image_url || book?.cover_image),
  pdf_url: buildUrl(book?.pdf_url),
});

export const fetchInstructorBooks = async () => {
  const { data } = await api.get("/instructor/books");
  return data?.data || [];
};

export const fetchBookAnalytics = async () => {
  const { data } = await api.get("/instructor/books/analytics");
  return data?.data ?? {};
};

export default { fetchInstructorBooks, fetchBookAnalytics };
