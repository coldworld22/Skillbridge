import api from "@/services/api/api";

export const fetchAllCategories = async (params = {}) => {
  const { data } = await api.get("/users/categories", { params });
  return data?.data;
};
