import api from "@/services/api/api";

export const getSystemErrors = async () => {
  // Explicit leading slash so both '/api' and full URL base paths work
  const res = await api.get("/system-errors");
  return res.data.data || res.data;
};
