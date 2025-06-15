import api from "@/services/api/api";

export const fetchDashboardStats = async () => {
  const { data } = await api.get("/community/admin/stats");
  return data?.data;
};

export const fetchDiscussions = async () => {
  const { data } = await api.get("/community/admin/discussions");
  return data?.data ?? [];
};

export const fetchDiscussionById = async (id) => {
  const { data } = await api.get(`/community/admin/discussions/${id}`);
  return data?.data ?? null;
};

export const lockDiscussionById = async (id) => {
  const { data } = await api.patch(`/community/admin/discussions/${id}/lock`);
  return data?.data;
};

export const deleteDiscussionById = async (id) => {
  await api.delete(`/community/admin/discussions/${id}`);
  return true;
};
