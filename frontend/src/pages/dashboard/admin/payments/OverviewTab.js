import React from "react";
import { useTranslation } from 'next-i18next';
import dayjs from "dayjs";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
);

export default function OverviewTab({ transactions = [], methods = [], payouts = [], onViewAll }) {
  const { t } = useTranslation('dashboard');
  // Treat "success" as equivalent to "paid" for older records
  const totalRevenue = transactions
    .filter((t) => {
      const status = (t.status || "").toLowerCase();
      return status === "paid" || status === "success";
    })
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const summaryCards = [
    { label: t('paymentsPage.total_revenue'), value: `$${totalRevenue.toFixed(2)}`, icon: "💰" },
    { label: t('paymentsPage.total_transactions'), value: transactions.length.toString(), icon: "🔁" },
    {
      label: t('paymentsPage.active_methods'),
      value: methods.filter((m) => m.active).length.toString(),
      icon: "💳",
    },
    {
      label: t('paymentsPage.pending_payouts'),
      value: payouts.filter((p) => p.status === "Pending" || p.status === "pending").length.toString(),
      icon: "🕒",
    },
  ];

  // Revenue over the last 7 days
  const last7Days = Array.from({ length: 7 }).map((_, i) =>
    dayjs().subtract(6 - i, "day"),
  );
  const revenueByDay = last7Days.map((d) => {
    const dateStr = d.format("YYYY-MM-DD");
    return transactions
      .filter(
        (t) =>
          t.status === "paid" &&
          dayjs(t.paid_at || t.created_at).format("YYYY-MM-DD") === dateStr,
      )
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  });

  const revenueLineData = {
    labels: last7Days.map((d) => d.format("MMM D")),
    datasets: [
      {
        label: t('paymentsPage.revenue_label'),
        data: revenueByDay,
        borderColor: "rgba(99, 102, 241, 1)",
        backgroundColor: "rgba(99, 102, 241, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const revenueLineOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
  };

  // Transaction status breakdown
  const statusCounts = transactions.reduce(
    (acc, t) => {
      const key = (t.status || "").toLowerCase();
      const normalized = key === "success" ? "paid" : key;
      if (acc[normalized] !== undefined) acc[normalized] += 1;
      return acc;
    },
    { paid: 0, pending: 0, failed: 0, refunded: 0 },
  );

  const transactionStatusData = {
    labels: [
      t('paymentsPage.paid'),
      t('paymentsPage.pending'),
      t('paymentsPage.failed'),
      t('paymentsPage.refunded'),
    ],
    datasets: [
      {
        data: [
          statusCounts.paid,
          statusCounts.pending,
          statusCounts.failed,
          statusCounts.refunded,
        ],
        backgroundColor: ["#22c55e", "#eab308", "#ef4444", "#6b7280"],
        hoverOffset: 8,
      },
    ],
  };

  const transactionStatusOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 12 },
      },
    },
  };

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => (
          <div key={idx} className="bg-white shadow rounded p-4 flex items-center gap-4">
            <div className="text-3xl">{card.icon}</div>
            <div>
              <div className="text-sm text-gray-500">{card.label}</div>
              <div className="text-xl font-semibold">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-2">{t('paymentsPage.revenue_over_time')}</h3>
          <Line data={revenueLineData} options={revenueLineOptions} className="w-full" />
        </div>
        <div className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-2">{t('paymentsPage.transactions_by_status')}</h3>
          <Doughnut
            data={transactionStatusData}
            options={transactionStatusOptions}
            className="w-full"
          />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white shadow rounded">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{t('paymentsPage.recent_transactions')}</h3>
          <button
            onClick={onViewAll}
            className="text-indigo-600 hover:underline text-sm"
          >
            {t('paymentsPage.view_all')}
          </button>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">{t('paymentsPage.user')}</th>
              <th className="px-4 py-2 text-left">{t('paymentsPage.method')}</th>
              <th className="px-4 py-2 text-left">{t('paymentsPage.amount')}</th>
              <th className="px-4 py-2 text-left">{t('paymentsPage.status')}</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.map((txn, idx) => {
                const status = (txn.status || "").toLowerCase();
                const colorClass =
                  status === "paid"
                    ? "bg-green-100 text-green-800"
                    : status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : status === "failed"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800";
                return (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{txn.user}</td>
                    <td className="px-4 py-2">{txn.method}</td>
                    <td className="px-4 py-2 text-green-600 font-medium">{txn.amount}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
                        {t(`paymentsPage.${status}`)}
                      </span>
                    </td>
                  </tr>
                );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
