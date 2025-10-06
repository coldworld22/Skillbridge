import api from "@/services/api/api";

export const fetchPlanFeatures = async (prefix) => {
  const { data } = await api.get("plans/features", {
    params: prefix ? { prefix } : {},
  });
  return data?.data ?? {};
};
