import api from "@/services/api/api";

export const fetchAllCategories = async (params = {}) => {
  const { data } = await api.get("/users/categories", { params });
  return data?.data;
};

export const fetchCategoryTree = async () => {
  const { data } = await api.get("/users/categories/tree");
  return data?.data ?? [];
};

export const fetchCategoryById = async (id) => {
  const { data } = await api.get(`/users/categories/${id}`);
  return data?.data;
};
