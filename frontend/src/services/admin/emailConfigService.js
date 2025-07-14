import api from "@/services/api/api";

export const fetchEmailConfig = async () => {
  const { data } = await api.get("/email-config");
  return data?.data ?? null;
};

export const updateEmailConfig = async (payload) => {
  const { data } = await api.put("/email-config", payload);
  return data?.data;
};
