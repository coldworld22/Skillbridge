import api from "@/services/api/api";

export const fetchTenantDomains = async () => {
  const { data } = await api.get("/tenant-domains");
  return data?.data ?? [];
};

export const createTenantDomain = async (payload) => {
  const { data } = await api.post("/tenant-domains", payload);
  return data?.data;
};

export const verifyTenantDomain = async (id, payload) => {
  const { data } = await api.post(`/tenant-domains/${id}/verify`, payload);
  return data?.data;
};

export const deleteTenantDomain = async (id) => {
  const { data } = await api.delete(`/tenant-domains/${id}`);
  return data?.data;
};
