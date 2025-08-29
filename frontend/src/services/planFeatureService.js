import api from "@/services/api/api";

export const fetchPlanFeatures = async () => {
  const { data } = await api.get("/plans/features");
  return data?.data ?? {};
};
