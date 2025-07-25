import api from "@/services/api/api";

export const getSystemErrors = async () => {
  const res = await api.get("/system-errors");
  return res.data.data || res.data;
};
