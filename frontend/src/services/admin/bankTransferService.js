import api from "@/services/api/api";

export const fetchBankTransfers = async () => {
  const { data } = await api.get("admin/payments/bank", {
    params: { status: "awaiting_approval" },
  });
  return data?.data ?? [];
};

export const approveBankTransfer = async (id) => {
  const { data } = await api.post(`admin/payments/bank/${id}/approve`);
  return data?.data;
};

export const rejectBankTransfer = async (id) => {
  const { data } = await api.post(`admin/payments/bank/${id}/reject`);
  return data?.data;
};

