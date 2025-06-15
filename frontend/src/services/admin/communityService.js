import api from "@/services/api/api";

export const fetchDashboardStats = async () => {
  const { data } = await api.get("/community/admin/stats");
  return data?.data;
};
