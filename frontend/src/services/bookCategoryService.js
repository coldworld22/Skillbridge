import api from "@/services/api/api";

export const fetchBookCategories = async (config = {}) => {
  if (Object.keys(config).length) {
    const { data } = await api.get("book-categories", config);
    return data?.data ?? [];
  }
  const { data } = await api.get("book-categories");
  return data?.data ?? [];
};

export default { fetchBookCategories };
