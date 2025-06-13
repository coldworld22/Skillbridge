import api from "@/services/api/api";

export const fetchAllCategories = async (params = {}) => {
  const res = await api.get("/users/categories", { params });
  return res.data?.data;
};
