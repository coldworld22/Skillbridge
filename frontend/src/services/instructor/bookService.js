import api from "@/services/api/api";

// Fetch books belonging to the current instructor with
// optional pagination, filtering and status parameters
export const fetchInstructorBooks = async ({
  page,
  perPage,
  filters = {},
  sort = {},
  status,
} = {}) => {
  const params = {
    ...(page !== undefined && { page }),
    ...(perPage !== undefined && { perPage }),
    ...filters,
    ...sort,
    ...(status ? { status } : {}),
  };

  let response;
  if (Object.keys(params).length) {
    response = await api.get("/instructor/books", { params });
  } else {
    response = await api.get("/instructor/books");
  }
  const { data } = response;
  const list = data?.data || [];
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

export const fetchAnalytics = async (params = {}) => {
  const { data } = await api.get("/instructor/books/analytics", { params });
  return data?.data || [];
};

export default {
  fetchInstructorBooks,
  createBook,
  updateBook,
  deleteBook,
  fetchAnalytics,
};
