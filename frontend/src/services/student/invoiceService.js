import api from "@/services/api/api";

export const fetchInvoiceByPaymentId = async (paymentId) => {
  const { data } = await api.get("/invoices/student");
  const invoices = data?.data || [];
  return invoices.find((inv) => String(inv.payment_id) === String(paymentId)) || null;
};
