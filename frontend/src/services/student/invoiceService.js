import api from "@/services/api/api";

export const fetchInvoiceByPaymentId = async (paymentId) => {
  const { data } = await api.get(
    `/invoices/student/payment/${paymentId}`
  );
  return data?.data || null;
};
