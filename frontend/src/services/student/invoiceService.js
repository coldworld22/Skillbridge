import api from "@/services/api/api";

export const fetchInvoiceByPaymentId = async (paymentId) => {
  const { data } = await api.get(
    `invoices/student/payment/${paymentId}`
  );
  return data?.data || null;
};

export const downloadInvoice = async (invoiceId) => {
  const res = await api.get(`invoices/student/${invoiceId}/download`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `invoice-${invoiceId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
