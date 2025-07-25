import api from "@/services/api/api";

export const getSystemErrors = async () => {
  // use relative path so Axios baseURL (default '/api') prefixes the request
  const res = await api.get("system-errors");
  return res.data.data || res.data;
};
