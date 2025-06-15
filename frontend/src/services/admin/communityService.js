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

export const fetchReports = async () => {
  const { data } = await api.get("/community/admin/reports");
  return data?.data ?? [];
};

export const updateReportStatus = async (id, status) => {
  const { data } = await api.patch(`/community/admin/reports/${id}`, { status });
  return data?.data;
};

export const fetchContributors = async () => {
  const { data } = await api.get('/community/admin/contributors');
  return data?.data ?? [];
};

// ─────────────────────────────────────────────────────────────────────────────
// Tags
// ─────────────────────────────────────────────────────────────────────────────

export const fetchTags = async () => {
  const { data } = await api.get('/community/admin/tags');
  return data?.data ?? [];
};

export const createTag = async (payload) => {
  const { data } = await api.post('/community/admin/tags', payload);
  return data?.data;
};

export const updateTag = async (id, payload) => {
  const { data } = await api.patch(`/community/admin/tags/${id}`, payload);
  return data?.data;
};

export const deleteTag = async (id) => {
  await api.delete(`/community/admin/tags/${id}`);
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// Announcements
// ─────────────────────────────────────────────────────────────────────────────

export const fetchAnnouncements = async () => {
  const { data } = await api.get('/community/admin/announcements');
  return data?.data ?? [];
};

export const createAnnouncement = async (payload) => {
  const { data } = await api.post('/community/admin/announcements', payload);
  return data?.data;
};

export const deleteAnnouncement = async (id) => {
  await api.delete(`/community/admin/announcements/${id}`);
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────

export const fetchCommunitySettings = async () => {
  const { data } = await api.get('/community/admin/settings');
  return data?.data ?? [];
};

export const updateCommunitySettings = async (payload) => {
  const { data } = await api.put('/community/admin/settings', payload);
  return data?.data;
};
