import api from "@/services/api/api";

export const fetchPublicPlans = async (role) => {
  const params = role ? { role } : {};
  const { data } = await api.get("plans", { params });
  return data?.data ?? [];
};

export const fetchPlanDetails = async (id) => {
  const { data } = await api.get(`plans/${id}`);
  return data?.data ?? data;
};
