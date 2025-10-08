import api from "@/services/api/api";

export const fetchFlaggedMessages = async () => {
  const { data } = await api.get("/moderation/flags");
  return data?.data ?? [];
};

