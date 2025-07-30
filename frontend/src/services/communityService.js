import api from "@/services/api/api";

export const fetchDiscussions = async () => {
  const { data } = await api.get("/community/discussions");
  return data?.data ?? [];
};

export const fetchDiscussionById = async (id) => {
  const { data } = await api.get(`/community/discussions/${id}`);
  return data?.data ?? null;
};

export const createDiscussion = async (payload) => {
  const { data } = await api.post('/community/discussions', payload);
  return data?.data;
};

export const fetchTopContributors = async (limit = 5) => {
  const { data } = await api.get(`/community/contributors?limit=${limit}`);
  return data?.data ?? [];
};

export const searchTags = async (q) => {
  const { data } = await api.get(`/community/tags?q=${encodeURIComponent(q)}`);
  return data?.data ?? [];
};

export const fetchReplies = async (discussionId) => {
  const { data } = await api.get(`/community/discussions/${discussionId}/replies`);
  return data?.data ?? [];
};

export const createReply = async (discussionId, payload) => {
  const { data } = await api.post(`/community/discussions/${discussionId}/replies`, payload);
  return data?.data;
};

export const likeDiscussion = async (id) => {
  const { data } = await api.post(`/community/discussions/${id}/like`);
  return data?.data;
};

export const unlikeDiscussion = async (id) => {
  const { data } = await api.delete(`/community/discussions/${id}/like`);
  return data?.data;
};

export const voteDiscussion = async (id, type) => {
  const { data } = await api.post(`/community/discussions/${id}/vote`, { type });
  return data?.data;
};
