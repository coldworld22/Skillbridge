import api from "@/services/api/api";

export const fetchAppConfig = async () => {
  const { data } = await api.get("/app-config");
  return data?.data ?? {};
};

export const updateAppConfig = async (payload) => {
  const { data } = await api.put("/app-config", payload);
  return data?.data;
};
