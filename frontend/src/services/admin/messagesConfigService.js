import api from "@/services/api/api";

export const fetchMessagesConfig = async () => {
  const { data } = await api.get("/messages/config");
  return data?.data ?? null;
};

export const updateMessagesConfig = async (payload) => {
  const { data } = await api.put("/messages/config", payload);
  return data?.data;
};
