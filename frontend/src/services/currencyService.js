import api from "@/services/api/api";

export const getCurrencies = async () => {
  const { data } = await api.get("/currencies");
  return data?.data ?? [];
};
