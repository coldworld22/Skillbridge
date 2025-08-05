import api from "@/services/api/api";

export const fetchBookCategories = async () => {
  const { data } = await api.get("/book-categories");
  return data?.data ?? [];
};

export default { fetchBookCategories };
