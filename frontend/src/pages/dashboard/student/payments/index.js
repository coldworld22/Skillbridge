import StudentLayout from "@/components/layouts/StudentLayout";
import { useState, useEffect } from "react";
import { FaCreditCard, FaClock, FaCheckCircle, FaFileInvoice } from "react-icons/fa";
import { fetchMyPayments, confirmPayment, uploadReceipt } from "@/services/student/paymentService";
import { useTranslation, Trans } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

export default function StudentPaymentsPage() {
  const { t } = useTranslation("dashboard", {
    keyPrefix: "studentPaymentsPage",
  });
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [reference, setReference] = useState("");
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMyPayments();
        setPayments(data);
      } catch (err) {
        console.error("Failed to load payments", err);
      }
    };
    load();
  }, []);

  const totalPaid = payments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const pending = payments.filter(p => p.status === "pending").length;

  const bankPayments = payments.filter(
    (p) =>
      (p.method === "bank" || p.method_name?.toLowerCase().includes("bank")) &&
      ["pending_payment", "awaiting_approval"].includes(p.status)
  );

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;
    try {
      let receiptUrl;
      if (receipt) {
        const uploaded = await uploadReceipt(receipt);
        receiptUrl = uploaded?.url;
      }
      await confirmPayment(selectedPayment.id, reference, receiptUrl);
      setPayments((prev) =>
        prev.map((p) =>
          p.id === selectedPayment.id
            ? { ...p, status: "awaiting_approval" }
            : p
        )
      );
      setSelectedPayment(null);
      setReference("");
      setReceipt(null);
    } catch (err) {
      console.error("Failed to confirm payment", err);
      alert(t("confirm_payment_failed"));
    }
  };

  const downloadInvoicePDF = async (id) => {
    const element = document.getElementById(`invoice-${id}`);
    if (!element) return alert(t("invoice_not_found"));
  
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff", // Fix transparency issues
        scale: 2, // High quality
      });
  
      const imgData = canvas.toDataURL("image/jpeg", 1.0); // ✅ use JPEG
      const pdf = new jsPDF("p", "mm", "a4");
  
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${id}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert(t("invoice_failed"));
    }
  };
  

  return (
    <StudentLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6 text-gray-800">
        <h1 className="text-3xl font-bold text-yellow-500">{t("title")}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
            <FaCheckCircle className="text-2xl text-green-500" />
            <div>
              <p className="text-sm text-gray-500">{t("total_paid")}</p>
              <h2 className="text-xl font-semibold">${totalPaid}</h2>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
            <FaClock className="text-2xl text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">{t("pending_payments")}</p>
              <h2 className="text-xl font-semibold">{pending}</h2>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
            <FaCreditCard className="text-2xl text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">{t("total_classes")}</p>
              <h2 className="text-xl font-semibold">{payments.length}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">{t("class")}</th>
                <th className="p-3">{t("amount")}</th>
                <th className="p-3">{t("method")}</th>
                <th className="p-3">{t("date")}</th>
                <th className="p-3">{t("status")}</th>
                <th className="p-3">{t("action")}</th>
                <th className="p-3">{t("invoice")}</th>
              </tr>
            </thead>
            <tbody>
              {bankPayments.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{p.class_title || p.item_id}</td>
                  <td className="p-3">${p.amount}</td>
                  <td className="p-3">{p.method_name || "-"}</td>
                  <td className="p-3">
                    {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "-"}
                  </td>
                  <td
                    className={`p-3 font-medium ${
                      p.status === "awaiting_approval"
                        ? "text-blue-600"
                        : p.status === "paid"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {t(`status_labels.${p.status}`)}
                  </td>
                  <td className="p-3">
                    {p.status === "pending_payment" ? (
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="text-blue-600 hover:underline"
                      >
                        {t("i_paid")}
                      </button>
                    ) : (
                      <span className="text-gray-500">
                        {t("awaiting_approval")}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => downloadInvoicePDF(p.id)}
                      className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                    >
                      <FaFileInvoice /> {t("download")}
                    </button>
                    <div id={`invoice-${p.id}`} className="hidden">
                      <div className="p-4 w-[600px] bg-white text-black">
                        <h2 className="text-xl font-bold mb-2">Invoice #{p.id}</h2>
                        <p><strong>Course:</strong> {p.class_title || p.item_id}</p>
                        <p><strong>Amount:</strong> ${p.amount}</p>
                        <p><strong>Status:</strong> {p.status}</p>
                        <p><strong>Date:</strong> {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "-"}</p>
                        <p><strong>Student:</strong> Sara Ali</p>
                        <p><strong>Email:</strong> sara@example.com</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md text-sm text-yellow-800">
          <Trans
            t={t}
            i18nKey="payment_issues"
            values={{ supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL }}
            components={{
              a: (
                <a
                  href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
                  className="underline font-medium"
                />
              ),
            }}
          />
        </div>

        {selectedPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded shadow max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-4">
                {t("confirm_bank_payment")}
              </h2>
              <form onSubmit={handleConfirm} className="space-y-3">
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={t("reference_placeholder")}
                  className="w-full border rounded p-2"
                  required
                />
                <input
                  type="file"
                  onChange={(e) => setReceipt(e.target.files[0])}
                  className="w-full"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPayment(null)}
                    className="px-3 py-1 rounded bg-gray-200"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-yellow-500 text-white"
                  >
                    {t("submit")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
