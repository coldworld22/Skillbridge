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
import { formatCurrency } from "@/utils/currency";
import { normalizePaymentStatus } from "@/utils/paymentStatus";
import styles from "./payments.module.scss";

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
    .filter((t) => normalizePaymentStatus(t.status) === "paid")
    .reduce((sum, t) => sum + parseFloat(t.amount ?? 0), 0);

  const summaryCards = [
    { label: t('paymentsPage.total_revenue'), value: formatCurrency(totalRevenue), icon: "💰" },
    { label: t('paymentsPage.total_transactions'), value: transactions.length.toString(), icon: "🔁" },
    {
      label: t('paymentsPage.active_methods'),
      value: methods.filter((m) => m.active).length.toString(),
      icon: "💳",
    },
    {
      label: t('paymentsPage.pending_payouts'),
      value: payouts
        .filter((p) => normalizePaymentStatus(p.status) === "pending")
        .length
        .toString(),
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
          normalizePaymentStatus(t.status) === "paid" &&
          dayjs(t.paid_at || t.created_at).format("YYYY-MM-DD") === dateStr,
      )
      .reduce((sum, t) => sum + parseFloat(t.amount ?? 0), 0);
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
      const normalized = normalizePaymentStatus(t.status);
      if (acc[normalized] !== undefined) acc[normalized] += 1;
      return acc;
    },
    { paid: 0, pending: 0, failed: 0, refunded: 0, rejected: 0 },
  );

  const transactionStatusData = {
    labels: [
      t('paymentsPage.paid'),
      t('paymentsPage.pending'),
      t('paymentsPage.failed'),
      t('paymentsPage.rejected'),
      t('paymentsPage.refunded'),
    ],
    datasets: [
      {
        data: [
          statusCounts.paid,
          statusCounts.pending,
          statusCounts.failed,
          statusCounts.rejected,
          statusCounts.refunded,
        ],
        backgroundColor: ["#22c55e", "#eab308", "#ef4444", "#f97316", "#6b7280"],
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

  const statusClass = (status) => {
    const normalized = normalizePaymentStatus(status);
    switch (normalized) {
      case "paid":
        return styles.statusPaid;
      case "pending":
        return styles.statusPending;
      case "failed":
        return styles.statusFailed;
      case "rejected":
        return styles.statusRejected;
      case "refunded":
        return styles.statusRefunded;
      default:
        return styles.statusMuted;
    }
  };

  return (
    <div className={styles.section}>
      {/* Summary Cards */}
      <div className={styles.statGrid}>
        {summaryCards.map((card, idx) => (
          <div key={idx} className={styles.statCard}>
            <div className={styles.statIcon}>{card.icon}</div>
            <div>
              <div className={styles.statLabel}>{card.label}</div>
              <div className={styles.statValue}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className={styles.chartGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>{t('paymentsPage.revenue_over_time')}</h3>
          <Line data={revenueLineData} options={revenueLineOptions} />
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>{t('paymentsPage.transactions_by_status')}</h3>
          <Doughnut data={transactionStatusData} options={transactionStatusOptions} />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className={styles.tableCard}>
        <div className={styles.tableCardHeader}>
          <h3 className={styles.cardTitle}>{t('paymentsPage.recent_transactions')}</h3>
          <button
            onClick={onViewAll}
            className={styles.actionButton}
          >
            {t('paymentsPage.view_all')}
          </button>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>{t('paymentsPage.user')}</th>
                <th className={styles.th}>{t('paymentsPage.method')}</th>
                <th className={styles.th}>{t('paymentsPage.amount')}</th>
                <th className={styles.th}>{t('paymentsPage.status')}</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((txn, idx) => {
                  const status = normalizePaymentStatus(txn.status);
                  return (
                    <tr key={idx} className={styles.rowHover}>
                      <td className={styles.td}>{txn.user}</td>
                      <td className={styles.td}>{txn.method}</td>
                      <td className={`${styles.td} ${styles.money}`}>
                        {formatCurrency(txn.amount, { currency: txn.currency })}
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.statusBadge} ${statusClass(status)}`}>
                          {t(`paymentsPage.${status}`, { defaultValue: t('paymentsPage.pending') })}
                        </span>
                      </td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
