import api from "@/services/api/api";

export const fetchPayouts = async () => {
  const { data } = await api.get("/payouts/admin");
  return data?.data ?? [];
};

export const updatePayout = async (id, payload) => {
  const { data } = await api.patch(`/payouts/admin/${id}`, payload);
  return data?.data;
};
