import { useEffect, useMemo, useState, useCallback } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { fetchInstructorPayments } from "@/services/instructor/paymentService";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

const matchesStatusFilter = (payment, filter) => {
  if (filter === "all") return true;
  if (filter === "paid") return payment.status === "paid";
  if (filter === "pending") {
    return (
      payment.status === "pending_payment" ||
      payment.status === "awaiting_approval"
    );
  }
  if (filter === "rejected") return payment.status === "rejected";
  return payment.status === filter;
};

const extractDate = (payment) => payment.paid_at || payment.created_at;

export default function InstructorPaymentsHistoryPage() {
  const { t } = useTranslation(["instructor-payments", "dashboard"]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const statusLabels = useMemo(
    () => ({
      paid: t("instructor-payments:common.status.paid"),
      awaiting_approval: t(
        "instructor-payments:common.status.awaiting_approval"
      ),
      pending_payment: t(
        "instructor-payments:common.status.pending_payment"
      ),
      rejected: t("instructor-payments:common.status.rejected"),
    }),
    [t]
  );

  const getMethodLabel = useCallback(
    (payment) => {
      if (payment?.method_name) return payment.method_name;
      if (payment?.source === "subscription")
        return t("instructor-payments:common.methods.subscription");
      if (payment?.status === "awaiting_approval" && payment?.reference_id)
        return t("instructor-payments:common.methods.manual_review");
      if (payment?.currency) {
        return t("instructor-payments:common.methods.currency_payment", {
          currency: payment.currency,
        });
      }
      return t("instructor-payments:common.methods.default");
    },
    [t]
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchInstructorPayments();
        if (active) {
          setPayments(data || []);
        }
      } catch (err) {
        console.error("Failed to load payment history", err);
        if (active)
          setError(
            t("instructor-payments:common.messages.errors.history")
          );
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [t]);

  const filteredHistory = useMemo(() => {
    return payments.filter((payment) => {
      if (!matchesStatusFilter(payment, statusFilter)) return false;
      const dateValue = extractDate(payment);
      if (!dateValue) return true;
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return true;

      if (startDate) {
        const start = new Date(startDate);
        if (date < start) return false;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (date > end) return false;
      }

      return true;
    });
  }, [payments, statusFilter, startDate, endDate]);

  const exportCSV = () => {
    const headers = [
      t("instructor-payments:history.export.headers.item"),
      t("instructor-payments:history.export.headers.gross_amount"),
      t("instructor-payments:history.export.headers.platform_fee"),
      t("instructor-payments:history.export.headers.net_amount"),
      t("instructor-payments:history.export.headers.date"),
      t("instructor-payments:history.export.headers.method"),
      t("instructor-payments:history.export.headers.status"),
    ];
    const rows = filteredHistory.map((payment) => [
      payment.item_title || payment.item_type,
      Number(payment.amount ?? 0).toFixed(2),
      Number(payment.platform_fee ?? 0).toFixed(2),
      Number(payment.instructor_amount ?? 0).toFixed(2),
      formatDate(extractDate(payment)),
      payment.method_name || "",
      statusLabels[payment.status] || payment.status,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = t("instructor-payments:history.export.filename");
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <InstructorLayout>
        <div className="p-6">
          {t("instructor-payments:common.messages.loading.history")}
        </div>
      </InstructorLayout>
    );
  }

  if (error) {
    return (
      <InstructorLayout>
        <div className="p-6 text-red-600">{error}</div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="p-6 space-y-6 text-gray-800">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {t("instructor-payments:history.title")}
          </h1>
          <button
            onClick={exportCSV}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded font-medium"
          >
            {t("instructor-payments:common.buttons.export_csv")}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium">
              {t("instructor-payments:common.labels.filter_status")}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="all">
                {t("instructor-payments:history.filters.all")}
              </option>
              <option value="paid">
                {t("instructor-payments:history.filters.paid")}
              </option>
              <option value="pending">
                {t("instructor-payments:history.filters.pending")}
              </option>
              <option value="rejected">
                {t("instructor-payments:history.filters.rejected")}
              </option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">
              {t("instructor-payments:common.labels.start_date")}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">
              {t("instructor-payments:common.labels.end_date")}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">
                  {t("instructor-payments:history.export.headers.item")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:history.export.headers.gross_amount")}
                </th>
                <th className="p-3">
                  {t(
                    "instructor-payments:history.export.headers.platform_fee"
                  )}
                </th>
                <th className="p-3">
                  {t("instructor-payments:history.export.headers.net_amount")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:history.export.headers.date")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:history.export.headers.method")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:history.export.headers.status")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {payment.item_title ||
                            t("instructor-payments:history.table.untitled")}
                        </span>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                          {payment.item_type}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      {formatCurrency(payment.amount, {
                        currency: payment.currency,
                      })}
                    </td>
                    <td className="p-3 text-red-500">
                      {formatCurrency(payment.platform_fee, {
                        currency: payment.currency,
                      })}
                    </td>
                    <td className="p-3 text-green-600 font-semibold">
                      {formatCurrency(payment.instructor_amount, {
                        currency: payment.currency,
                      })}
                    </td>
                    <td className="p-3">{formatDate(extractDate(payment))}</td>
                    <td className="p-3">
                      {payment.method_name || getMethodLabel(payment)}
                    </td>
                    <td className="p-3 font-medium">
                      {statusLabels[payment.status] || payment.status}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    {t("instructor-payments:common.empty.payments")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </InstructorLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["dashboard", "instructor-payments"],
        nextI18NextConfig
      )),
    },
  };
}
