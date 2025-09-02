import api from "@/services/api/api";

export const fetchMyPayments = async () => {
  const { data } = await api.get("/payments/student");
  return data?.data ?? [];
};

export const fetchPayment = async (id) => {
  const { data } = await api.get(`/payments/student/${id}`);
  return data?.data ?? null;
};

export const createPayment = async (payload) => {
  const { data } = await api.post("/payments/student", payload);
  return data?.data ?? data;
};

export const uploadReceipt = async (file) => {
  const formData = new FormData();
  formData.append("receipt", file);
  const { data } = await api.post("/payments/student/receipts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data;
};

export const confirmPayment = async (paymentId, reference, receiptUrl) => {
  const payload = {
    reference_id: reference,
    receipt_url: receiptUrl,
  };
  const { data } = await api.post(
    `/payments/student/${paymentId}/confirm`,
    payload
  );
  return data?.data;
};
