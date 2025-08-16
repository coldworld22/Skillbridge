import api from "@/services/api/api";

export const fetchMyPayments = async () => {
  const { data } = await api.get("/payments/student");
  return data?.data ?? [];
};

export const uploadReceipt = async (file) => {
  const formData = new FormData();
  formData.append("receipt", file);
  const { data } = await api.post("/payments/student/receipts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data;
};

export const confirmBankPayment = async (paymentId, reference, file) => {
  const formData = new FormData();
  formData.append("payment_id", paymentId);
  formData.append("transaction_reference", reference);
  if (file) formData.append("receipt", file);
  const { data } = await api.post("/payments/bank/confirm", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data;
};
