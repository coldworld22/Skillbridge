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

export const createRole = async (payload) => {
  const { data } = await api.post("/roles", payload);
  return data?.data;
};

export const updateRole = async (id, payload) => {
  const { data } = await api.put(`/roles/${id}`, payload);
  return data?.data;
};

export const deleteRole = async (id) => {
  await api.delete(`/roles/${id}`);
  return true;
};

export const createPermission = async (payload) => {
  const { data } = await api.post('/roles/permissions', payload);
  return data?.data;
};

export const updatePermission = async (id, payload) => {
  const { data } = await api.put(`/roles/permissions/${id}`, payload);
  return data?.data;
};

export const deletePermission = async (id) => {
  await api.delete(`/roles/permissions/${id}`);
  return true;
};
