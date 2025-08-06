import api from "@/services/api/api";

export const fetchBooks = async () => {
  const { data } = await api.get("/books");
  return data?.data ?? [];
};

export const fetchBook = async (id) => {
  const { data } = await api.get(`/books/${id}`);
  return data?.data;
};

export const deleteBook = async (id) => {
  await api.delete(`/books/${id}`);
  return true;
};

export const updateBook = async (id, formData, onUploadProgress) => {
  const { data } = await api.put(`/books/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return data?.data;
};

export default { fetchBooks, fetchBook, deleteBook, updateBook };
