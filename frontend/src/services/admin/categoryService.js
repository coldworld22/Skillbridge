// ─────────────────────────────────────────────────────────
// Admin Category Management API helpers
// See docs/admin-category-management.md
// ─────────────────────────────────────────────────────────
import api from "@/services/api/api";

export const fetchAllCategories = async (params = {}, config = {}) => {
  const { data } = await api.get("/users/admin/categories", { params, ...config });
  return data?.data;
};

export const fetchCategoryTree = async () => {
  const { data } = await api.get("/users/admin/categories/tree");
  return data?.data ?? [];
};

export const fetchCategoryById = async (id) => {
  const { data } = await api.get(`/users/admin/categories/${id}`);
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

export const updateCategoryStatus = async (id, status) => {
  const { data } = await api.patch(`/users/admin/categories/${id}/status`, {
    status,
  });
  return data?.data;
};
