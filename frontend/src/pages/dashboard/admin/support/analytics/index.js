import AdminLayout from "@/components/layouts/AdminLayout";
import PageHead from "@/components/common/PageHead";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import useSupportTranslation from "@/hooks/useSupportTranslation";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import { fetchSupportAnalytics } from "@/services/supportService";
import styles from "@/components/support/SupportDashboard.module.scss";

export default function AdminSupportAnalytics() {
  const { t } = useSupportTranslation();
  const [stats, setStats] = useState({ open: 0, resolved: 0, closed: 0, avg: '0h' });
  const [chart, setChart] = useState([]);

  useEffect(() => {
    fetchSupportAnalytics()
      .then((data) => {
        setStats({
          open: data.open,
          resolved: data.resolved,
          closed: data.closed,
          avg: `${data.avgHours?.toFixed ? data.avgHours.toFixed(1) : data.avgHours}h`,
        });
        setChart(data.chart);
      })
      .catch((err) => {
        console.error("Failed to load analytics", err);
      });
  }, []);

  return (
    <AdminLayout>
      <PageHead title={t('support_analytics')} />
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('support_analytics')}</h1>
        </div>

        <div className={styles.metricsGrid}>
          {[
            { label: 'Open', value: stats.open },
            { label: 'Resolved', value: stats.resolved },
            { label: 'Closed', value: stats.closed },
            { label: 'Avg. Response', value: stats.avg },
          ].map((m) => (
            <div key={m.label} className={styles.metricCard}>
              <div className={styles.metricValue}>{m.value}</div>
              <div className={styles.metricLabel}>{m.label}</div>
            </div>
          ))}
        </div>

        <div className={styles.chartCard}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="tickets" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
