import api from "@/services/api/api";

export const fetchPolicies = async () => {
  const { data } = await api.get("/policies");
  return data?.data ?? {};
};

export const updatePolicies = async (payload) => {
  const { data } = await api.put("/policies", payload);
  return data?.data;
};
