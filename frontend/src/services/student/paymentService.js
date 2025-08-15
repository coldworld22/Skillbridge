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
