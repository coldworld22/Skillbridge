import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";

const formatUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:"))
    return url;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
  const apiBase = base.replace(/\/?api\/?$/, "");
  return `${apiBase}${url}`;
};

const formatDiscussion = (d) => ({
  ...d,
  user_avatar: formatUrl(d.user_avatar),
  image_url: formatUrl(d.image_url),
  replies: d.replies ?? 0,
});

const formatReply = (r) => ({
  ...r,
  user_avatar: formatUrl(r.user_avatar),
  file_url: formatUrl(r.file_url),
});

export const fetchDiscussions = async () => {
  const { data } = await api.get("/community/discussions");
  const list = data?.data ?? [];
  return list.map(formatDiscussion);
};

export const fetchDiscussionById = async (id) => {
  const { data } = await api.get(`/community/discussions/${id}`);
  const d = data?.data ?? null;
  return d ? formatDiscussion(d) : null;
};

export const createDiscussion = async (payload) => {
  const config = payload instanceof FormData
    ? { headers: { "Content-Type": "multipart/form-data" } }
    : {};
  const { data } = await api.post('/community/discussions', payload, config);
  return data?.data;
};

export const fetchTopContributors = async (limit = 5) => {
  const { data } = await api.get(`/community/contributors?limit=${limit}`);
  const list = data?.data ?? [];
  return list.map(c => ({
    ...c,
    avatar: formatUrl(c.avatar),
  }));
};

export const searchTags = async (q) => {
  const { data } = await api.get(`/community/tags?q=${encodeURIComponent(q)}`);
  return data?.data ?? [];
};

export const fetchReplies = async (discussionId) => {
  const { data } = await api.get(`/community/discussions/${discussionId}/replies`);
  const list = data?.data ?? [];
  return list.map(formatReply);
};

export const createReply = async (discussionId, payload) => {
  const { data } = await api.post(`/community/discussions/${discussionId}/replies`, payload);
  return data?.data ? formatReply(data.data) : null;
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
