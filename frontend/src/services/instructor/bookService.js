import api from "@/services/api/api";
import { formatBook, normalizeBookFilters } from "@/services/bookService";

// Fetch books belonging to the current instructor with
// optional pagination, filtering and status parameters
export const fetchInstructorBooks = async ({
  page,
  perPage,
  filters = {},
  sort = {},
  status,
  ...config
} = {}) => {
  const normalizedFilters = normalizeBookFilters(filters);
  const normalizedSort = normalizeBookFilters(sort);
  const params = {
    ...(page !== undefined && { page }),
    ...(perPage !== undefined && { perPage }),
    ...normalizedFilters,
    ...normalizedSort,
    ...(status ? { status } : {}),
  };

  const requestConfig = Object.keys(params).length
    ? { params, ...config }
    : { ...config };
  const { data } = Object.keys(requestConfig).length
    ? await api.get("/instructor/books", requestConfig)
    : await api.get("/instructor/books");
  const list = data?.data ? data.data.map(formatBook) : [];
  return { books: list, meta: data?.meta ?? {} };

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

export const deleteBook = async (id) => {
  await api.delete(`/books/${id}`);
  return true;
};

// Fetch a single book by ID for the current instructor
export const fetchBook = async (id, config = {}) => {
  const { data } = await api.get(`/instructor/books/${id}`, config);
  const book = data?.data || null;
  return book ? formatBook(book) : null;
};

// Fetch aggregated analytics about the instructor's books
export const fetchBookAnalytics = async (params = {}) => {
  const { data } = await api.get("/instructor/books/analytics", { params });
  return data?.data || [];
};

const instructorBookService = {
  fetchInstructorBooks,
  createBook,
  updateBook,
  deleteBook,
  fetchBook,
  fetchBookAnalytics,
};

export default instructorBookService;
