import api from "@/services/api/api";

export const getAppConfig = async () => {
  const { data } = await api.get("/app-config");
  return data?.data ?? {};
};
