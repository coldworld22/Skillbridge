import api from "@/services/api/api";

export const fetchPlans = async () => {
  const { data } = await api.get("/plans");
  return data?.data ?? [];
};

export const fetchPlanById = async (id) => {
  const { data } = await api.get(`/plans/${id}`);
  return data?.data ?? null;
};

export const createPlan = async (payload) => {
  const { data } = await api.post("/plans", payload);
  return data?.data;
};

export const updatePlan = async (id, payload) => {
  const { data } = await api.put(`/plans/${id}`, payload);
  return data?.data;
};

export const deletePlan = async (id) => {
  await api.delete(`/plans/${id}`);
  return true;
};
