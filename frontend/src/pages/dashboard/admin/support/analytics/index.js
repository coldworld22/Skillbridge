import AdminLayout from "@/components/layouts/AdminLayout";
import PageHead from "@/components/common/PageHead";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

export default function AdminSupportAnalytics() {
  const { t } = useTranslation('dashboard');
  const [stats, setStats] = useState({ open: 0, pending: 0, resolved: 0, avg: '0h' });
  const [chart, setChart] = useState([]);

  useEffect(() => {
    const generate = () => {
      setStats({
        open: Math.floor(Math.random() * 20) + 5,
        pending: Math.floor(Math.random() * 10) + 2,
        resolved: Math.floor(Math.random() * 30) + 10,
        avg: `${Math.floor(Math.random() * 4) + 1}h`,
      });
      setChart(
        Array.from({ length: 7 }).map((_, i) => ({
          day: `Day ${i + 1}`,
          tickets: Math.floor(Math.random() * 20) + 5,
        }))
      );
    };
    generate();
  }, []);

  return (
    <AdminLayout>
      <PageHead title={t('support_analytics')} />
      <div className="p-6 space-y-8">
        <h1 className="text-2xl font-bold">{t('support_analytics')}</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Open', value: stats.open },
            { label: 'Pending', value: stats.pending },
            { label: 'Resolved', value: stats.resolved },
            { label: 'Avg. Response', value: stats.avg },
          ].map((m) => (
            <div key={m.label} className="bg-white rounded shadow p-4 text-center">
              <div className="text-2xl font-bold">{m.value}</div>
              <div className="text-sm text-gray-500">{m.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded shadow p-4">
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

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
