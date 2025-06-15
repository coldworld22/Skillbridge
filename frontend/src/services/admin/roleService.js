import api from "@/services/api/api";

export const fetchAllRoles = async () => {
  const { data } = await api.get("/roles");
  return data?.data ?? [];
};

export const fetchRoleById = async (id) => {
  const { data } = await api.get(`/roles/${id}`);
  return data?.data;
};

export const fetchAllPermissions = async () => {
  const { data } = await api.get("/roles/permissions");
  return data?.data ?? [];
};

export const updateRolePermissions = async (id, permissionIds) => {
  const { data } = await api.post(`/roles/${id}/permissions`, { permissionIds });
  return data?.data;
};
