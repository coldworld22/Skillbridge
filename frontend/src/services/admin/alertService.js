import api from "@/services/api/api";

export const fetchRecentAlerts = async () => {
  const { data } = await api.get("system-errors");
  return data?.data ?? [];
};

