import api from "@/services/api/api";

export const purchaseBook = async (bookId) => {
  const { data } = await api.post("/checkout", { books: [bookId] });
  return data;
};

export default { purchaseBook };
