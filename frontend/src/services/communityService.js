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
