import api from "@/services/api/api";

export const fetchAdminClasses = async () => {
  const { data } = await api.get("/users/classes/admin");
  return data?.data ?? [];
};

export const fetchAdminClassById = async (id) => {
  const { data } = await api.get(`/users/classes/admin/${id}`);
  return data?.data ?? null;
};

export const createAdminClass = async (payload) => {
  const { data } = await api.post("/users/classes/admin", payload);
  return data?.data;
};

export const updateAdminClass = async (id, payload) => {
  const { data } = await api.put(`/users/classes/admin/${id}`, payload);
  return data?.data;
};

export const deleteAdminClass = async (id) => {
  await api.delete(`/users/classes/admin/${id}`);
  return true;
};
