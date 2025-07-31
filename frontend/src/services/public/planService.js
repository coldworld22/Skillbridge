import api from "@/services/api/api";

export const fetchPublicPlans = async () => {
  const { data } = await api.get("/plans");
  return data?.data ?? [];
};
