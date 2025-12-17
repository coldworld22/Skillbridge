import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useEffect, useMemo, useState } from "react";
import { FaInfoCircle, FaDownload, FaFilePdf } from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { fetchInstructorPayments } from "@/services/instructor/paymentService";
import { formatCurrency } from "@/utils/currency";
import { useTranslation, Trans } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const extractDate = (payment) => payment.paid_at || payment.created_at;

export default function InstructorTutorialEarningsPage() {
  const { t } = useTranslation(["instructor-payments", "dashboard"]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchInstructorPayments({ itemType: "tutorial" });
        if (active) setPayments(data || []);
      } catch (err) {
        console.error("Failed to load tutorial earnings", err);
        if (active)
          setError(
            t("instructor-payments:common.messages.errors.tutorials")
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

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
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
  }, [payments, startDate, endDate]);

  const tutorialSummaries = useMemo(() => {
    const map = new Map();
    filteredPayments.forEach((payment) => {
      const key = payment.item_id || payment.id;
      const existing = map.get(key) || {
        id: key,
        title:
          payment.item_title ||
          t("instructor-payments:dashboard.transactions.untitled"),
        price: payment.item_price,
        students: 0,
        totalGross: 0,
        totalNet: 0,
        commission: 0,
        currency: payment.currency || "USD",
      };

      const gross = Number(payment.amount ?? 0);
      const net = Number(payment.instructor_amount ?? 0);
      const fee =
        payment.platform_fee !== undefined
          ? Number(payment.platform_fee ?? 0)
          : gross - net;

      if (payment.status === "paid") {
        existing.students += 1;
      }

      existing.totalGross += gross;
      existing.totalNet += net;
      existing.commission += fee;
      existing.currency = payment.currency || existing.currency;

      map.set(key, existing);
    });
    return Array.from(map.values());
  }, [filteredPayments, t]);

  const chartData = {
    labels: tutorialSummaries.map((item) => item.title),
    datasets: [
      {
        label: t("instructor-payments:common.tables.commission"),
        data: tutorialSummaries.map((item) => item.commission),
        backgroundColor: "#fbbf24",
      },
      {
        label: t("instructor-payments:common.tables.net_earnings"),
        data: tutorialSummaries.map((item) => item.totalNet),
        backgroundColor: "#34d399",
      },
    ],
  };

  const totalCommission = tutorialSummaries.reduce(
    (sum, item) => sum + item.commission,
    0
  );
  const totalNet = tutorialSummaries.reduce(
    (sum, item) => sum + item.totalNet,
    0
  );
  const commissionPercent =
    totalCommission + totalNet === 0
      ? 0
      : ((totalCommission / (totalCommission + totalNet)) * 100).toFixed(1);
  const netPercent = (100 - Number(commissionPercent)).toFixed(1);

  const exportCSV = () => {
    const headers = [
      t("instructor-payments:common.tables.title"),
      t("instructor-payments:common.tables.students"),
      t("instructor-payments:common.tables.avg_price"),
      t("instructor-payments:common.tables.gross_amount"),
      t("instructor-payments:common.tables.platform_fee"),
      t("instructor-payments:common.tables.net_earnings"),
    ];
    const rows = tutorialSummaries.map((item) => [
      item.title,
      item.students,
      item.totalGross.toFixed(2),
      item.commission.toFixed(2),
      item.totalNet.toFixed(2),
      item.price !== undefined ? Number(item.price ?? 0).toFixed(2) : "",
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = t("instructor-payments:tutorials.export.filename");
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    alert(t("instructor-payments:common.messages.info.pdf_unavailable"));
  };

  if (loading) {
    return (
      <InstructorLayout>
        <div className="p-6">
          {t("instructor-payments:common.messages.loading.tutorials")}
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
      <div className="p-6 text-gray-800 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {t("instructor-payments:tutorials.title")}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black font-medium rounded hover:bg-yellow-600"
            >
              <FaDownload />{" "}
              {t("instructor-payments:common.buttons.export_csv")}
            </button>
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600"
            >
              <FaFilePdf />{" "}
              {t("instructor-payments:common.buttons.download_tax_pdf")}
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("instructor-payments:common.labels.start_date")}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("instructor-payments:common.labels.end_date")}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border p-2 rounded"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">
                  {t("instructor-payments:common.tables.title")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:common.tables.students")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:common.tables.avg_price")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:common.tables.gross_amount")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:common.tables.platform_fee")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:common.tables.net_earnings")}
                </th>
              </tr>
            </thead>
            <tbody>
              {tutorialSummaries.length > 0 ? (
                tutorialSummaries.map((item) => {
                  const avgPrice =
                    item.students > 0
                      ? item.totalGross / item.students
                      : item.price ?? 0;
                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{item.title}</td>
                      <td className="p-3">{item.students}</td>
                      <td className="p-3">
                        {formatCurrency(avgPrice, {
                          currency: item.currency,
                        })}
                      </td>
                      <td className="p-3 text-gray-700">
                        {formatCurrency(item.totalGross, {
                          currency: item.currency,
                        })}
                      </td>
                      <td className="p-3 text-red-500">
                        {formatCurrency(item.commission, {
                          currency: item.currency,
                        })}
                      </td>
                      <td className="p-3 text-blue-600 font-semibold">
                        {formatCurrency(item.totalNet, {
                          currency: item.currency,
                        })}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    {t("instructor-payments:common.empty.tutorial_earnings")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            {t("instructor-payments:common.labels.commission_vs_net")}
          </h2>
          <Bar data={chartData} />
          <p className="mt-4 text-sm text-gray-500">
            {t("instructor-payments:common.labels.commission_net_ratio", {
              commission: commissionPercent,
              net: netPercent,
            })}
          </p>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md text-sm text-yellow-900 flex gap-2 mt-6">
          <FaInfoCircle className="mt-0.5" />
          <div>
            <p>{t("instructor-payments:tutorials.info_notice")}</p>
            <p className="mt-1">
              <Trans
                i18nKey="tutorials.info_cta"
                ns="instructor-payments"
                components={{
                  link: (
                    <a
                      href={t("instructor-payments:tutorials.policy_link_href")}
                      className="underline hover:text-yellow-600"
                    />
                  ),
                }}
              />
            </p>
          </div>
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
