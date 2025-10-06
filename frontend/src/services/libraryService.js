import api from "@/services/api/api";

export const fetchLibrary = async () => {
  const { data } = await api.get("library");
  return data?.data ?? [];
};

export default { fetchLibrary };
