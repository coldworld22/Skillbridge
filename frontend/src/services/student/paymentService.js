import api from "@/services/api/api";

export const fetchMyPayments = async () => {
  const { data } = await api.get("/payments/student");
  return data?.data ?? [];
};
