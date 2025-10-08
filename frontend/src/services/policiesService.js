import api from "@/services/api/api";

export const getPolicies = async () => {
  const { data } = await api.get("/policies");
  return data?.data ?? {};
};
