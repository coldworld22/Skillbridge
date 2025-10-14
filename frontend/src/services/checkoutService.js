import api from "@/services/api/api";

export const purchaseBook = async (bookId) => {
  const payload = Array.isArray(bookId) ? { books: bookId } : { books: [bookId] };
  const { data } = await api.post("/books/checkout", payload);
  return data;
};

export default { purchaseBook };
