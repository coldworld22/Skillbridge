import { useEffect, useMemo, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { fetchInstructorWithdrawals } from "@/services/instructor/paymentService";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

export default function InstructorWithdrawalsPage() {
  const { t } = useTranslation(["instructor-payments", "dashboard"]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const statusLabels = useMemo(
    () => ({
      pending: t("instructor-payments:common.status.pending"),
      processing: t("instructor-payments:common.status.pending"),
      in_review: t("instructor-payments:common.status.pending"),
      approved: t("instructor-payments:common.status.approved"),
      rejected: t("instructor-payments:common.status.rejected"),
      cancelled: t("instructor-payments:common.status.cancelled"),
      unknown: t("instructor-payments:common.status.unknown"),
    }),
    [t]
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchInstructorWithdrawals();
        if (active) {
          const normalized = (Array.isArray(data) ? data : []).map((withdrawal) => {
            const status = String(withdrawal.status || "").toLowerCase();
            const rawAmount = Number(withdrawal.amount ?? 0);
            const amount = Number.isFinite(rawAmount) ? rawAmount : 0;
            return {
              ...withdrawal,
              status,
              amount,
              currency: withdrawal.currency || "USD",
              notes:
                typeof withdrawal.notes === "string"
                  ? withdrawal.notes
                  : withdrawal.notes
                  ? String(withdrawal.notes)
                  : "",
            };
          });
          setWithdrawals(normalized);
        }
      } catch (err) {
        console.error("Failed to load withdrawals", err);
        if (active)
          setError(
            t("instructor-payments:common.messages.errors.withdrawals")
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

  const exportCSV = () => {
    const headers = [
      t("instructor-payments:common.tables.amount"),
      t("instructor-payments:common.tables.currency"),
      t("instructor-payments:common.tables.status"),
      t("instructor-payments:common.tables.requested"),
      t("instructor-payments:common.tables.processed"),
      t("instructor-payments:common.tables.notes"),
    ];
    const rows = withdrawals.map((withdrawal) => [
      withdrawal.amount.toFixed(2),
      withdrawal.currency,
      statusLabels[withdrawal.status] || statusLabels.unknown,
      withdrawal.requested_at || "",
      withdrawal.processed_at || "",
      withdrawal.notes.replace(/\n/g, " "),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = t("instructor-payments:withdrawals.export.filename");
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const totals = useMemo(() => {
    const approved = withdrawals
      .filter((w) => w.status === "approved")
      .reduce((sum, w) => sum + w.amount, 0);
    const pending = withdrawals
      .filter((w) => ["pending", "processing", "in_review"].includes(w.status))
      .reduce((sum, w) => sum + w.amount, 0);
    return { approved, pending };
  }, [withdrawals]);

  if (loading) {
    return (
      <InstructorLayout>
        <div className="p-6">
          {t("instructor-payments:common.messages.loading.withdrawals")}
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
            {t("instructor-payments:withdrawals.title")}
          </h1>
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded shadow"
          >
            {t("instructor-payments:common.buttons.export_csv")}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="text-sm text-gray-500">
              {t("instructor-payments:withdrawals.stats.approved")}
            </div>
            <div className="text-xl font-semibold text-green-600">
              {formatCurrency(totals.approved)}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="text-sm text-gray-500">
              {t("instructor-payments:withdrawals.stats.pending")}
            </div>
            <div className="text-xl font-semibold text-yellow-600">
              {formatCurrency(totals.pending)}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">
                  {t("instructor-payments:common.tables.amount")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:common.tables.status")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:common.tables.requested")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:common.tables.processed")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:common.tables.notes")}
                </th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length > 0 ? (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold text-gray-800">
                      {formatCurrency(withdrawal.amount, {
                        currency: withdrawal.currency,
                      })}
                    </td>
                    <td className="p-3 font-medium">
                      {statusLabels[withdrawal.status] ||
                        statusLabels.unknown}
                    </td>
                    <td className="p-3">
                      {formatDateTime(withdrawal.requested_at)}
                    </td>
                    <td className="p-3">
                      {formatDateTime(withdrawal.processed_at)}
                    </td>
                    <td className="p-3 whitespace-pre-wrap text-sm text-gray-600">
                      {withdrawal.notes || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    {t("instructor-payments:common.empty.withdrawals")}
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
