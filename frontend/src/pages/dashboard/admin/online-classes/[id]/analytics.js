// pages/dashboard/admin/online-classes/[id]/analytics.js
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import { fetchAdminClassAnalytics } from "@/services/admin/classService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f87171"];

// ─────────────────────
// Fallback analytics when API fails
// ─────────────────────
const EMPTY_STATS = {
  totalStudents: 0,
  totalRevenue: 0,
  totalAttendance: 0,
  completed: 0,
  revenueBreakdown: {
    full: 0,
    installments: 0,
    free: 0,
  },
  locations: [],
  devices: [],
  registrationTrend: [],
};

function AnalyticsDashboard() {
  const router = useRouter();
  const { id } = router.query;
  const { t, i18n } = useTranslation('dashboard');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchAdminClassAnalytics(id)
      .then((data) => setStats(data))
      .catch((err) => {
        console.error("Failed to load analytics", err);
        setStats(EMPTY_STATS);
      });
  }, [id]);

  if (!stats) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground" dir={i18n.dir()}>
        {t('classAnalyticsPage.loading')}
      </div>
    );
  }

  const avgRevenue =
    stats.totalStudents > 0
      ? (stats.totalRevenue / stats.totalStudents).toFixed(2)
      : "0";
  const attendanceRate =
    stats.totalStudents > 0
      ? ((stats.totalAttendance / stats.totalStudents) * 100).toFixed(1)
      : "0";
  const completionRate =
    stats.totalStudents > 0
      ? ((stats.completed / stats.totalStudents) * 100).toFixed(1)
      : "0";

  return (
    <div className="p-6 space-y-6" dir={i18n.dir()}>
      <h1 className="text-2xl font-bold text-gray-800">
        📊 {t('classAnalyticsPage.title')} - {t('classAnalyticsPage.class_id')} {id}
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">👥 {t('classAnalyticsPage.total_enrolled_students')}</h2>
          <p className="text-3xl font-bold text-green-600">{stats.totalStudents}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">💰 {t('classAnalyticsPage.total_revenue')}</h2>
          <p className="text-3xl font-bold text-indigo-600">${stats.totalRevenue}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">💳 {t('classAnalyticsPage.revenue_breakdown')}</h2>
          <ul className="text-gray-700 space-y-1">
            <li><strong>{t('classAnalyticsPage.full_payments')}:</strong> {stats.revenueBreakdown.full}</li>
            <li><strong>{t('classAnalyticsPage.installments')}:</strong> {stats.revenueBreakdown.installments}</li>
            <li><strong>{t('classAnalyticsPage.free_seats')}:</strong> {stats.revenueBreakdown.free}</li>
          </ul>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">📊 {t('classAnalyticsPage.avg_revenue_per_student')}</h2>
          <p className="text-3xl font-bold text-yellow-600">${avgRevenue}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">✅ {t('classAnalyticsPage.attendance_rate')}</h2>
          <p className="text-3xl font-bold text-blue-600">{attendanceRate}%</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">🎯 {t('classAnalyticsPage.completion_rate')}</h2>
          <p className="text-3xl font-bold text-purple-600">{completionRate}%</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">🌍 {t('classAnalyticsPage.top_countries')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stats.locations} dataKey="value" nameKey="name" outerRadius={100}>
                {stats.locations.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">📱 {t('classAnalyticsPage.devices_used')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stats.devices} dataKey="value" nameKey="name" outerRadius={100}>
                {stats.devices.map((entry, index) => (
                  <Cell key={`cell-dev-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">📈 {t('classAnalyticsPage.registration_trend')}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.registrationTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="students" fill="#facc15" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

AnalyticsDashboard.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedAnalyticsDashboard = withAuthProtection(AnalyticsDashboard, {
  permissions: ['manage_online_classes'],
});
ProtectedAnalyticsDashboard.getLayout = AnalyticsDashboard.getLayout;

export default ProtectedAnalyticsDashboard;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
