import api from "@/services/api/api";
import { buildUrl } from "@/utils/url";

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
  const params = {
    ...(page !== undefined && { page }),
    ...(perPage !== undefined && { perPage }),
    ...filters,
    ...sort,
    ...(status ? { status } : {}),
  };

  const requestConfig = Object.keys(params).length
    ? { params, ...config }
    : { ...config };
  const { data } = Object.keys(requestConfig).length
    ? await api.get("/instructor/books", requestConfig)
    : await api.get("/instructor/books");
  const list = data?.data
    ? data.data.map((book) => ({
        ...book,
        cover_image_url: buildUrl(book?.cover_image_url || book?.cover_image),
      }))
    : [];
  return { books: list, meta: data?.meta ?? {} };

};

export const createBook = async (formData, onUploadProgress) => {
  const { data } = await api.post("/books", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return data?.data;
};

export const updateBook = async (id, formData, onUploadProgress) => {
  const { data } = await api.put(`/books/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return data?.data;
};

export const deleteBook = async (id) => {
  await api.delete(`/books/${id}`);
  return true;
};

// Fetch a single book by ID for the current instructor
export const fetchBook = async (id) => {
  const { data } = await api.get(`/books/${id}`);
  const book = data?.data || null;
  return book
    ? {
        ...book,
        cover_image_url: buildUrl(book?.cover_image_url || book?.cover_image),
      }
    : null;
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
