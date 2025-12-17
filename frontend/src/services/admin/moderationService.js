import api from "@/services/api/api";

export const fetchFlaggedMessages = async (params = {}) => {
  const { data } = await api.get("/moderation/flags", { params });
  return data?.data ?? [];
};

export const updateFlaggedMessageStatus = async (id, payload) => {
  const { data } = await api.patch(`/moderation/flags/${id}`, payload);
  return data?.data ?? null;
};
