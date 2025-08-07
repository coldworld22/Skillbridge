import api from "@/services/api/api";

export const fetchInstructorBooks = async () => {
  const { data } = await api.get("/instructor/books");
  return data?.data || [];
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
