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

export const createCategory = async (formData) => {
  const { data } = await api.post("/users/admin/categories/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data;
};

export const updateCategory = async (id, formData) => {
  const { data } = await api.put(`/users/admin/categories/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data;
};

export const deleteCategory = async (id) => {
  await api.delete(`/users/admin/categories/${id}`);
  return true;
};
