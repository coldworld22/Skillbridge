// pages/dashboard/admin/online-classes/[id]/analytics.js
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import { fetchAdminClassAnalytics } from "@/services/admin/classService";
import AnalyticsCharts from "@/components/admin/online-classes/AnalyticsCharts";

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
  const rawId = router.query?.id;
  const classId = Array.isArray(rawId) ? rawId[0] : rawId ?? "";
  const { t, i18n } = useTranslation('dashboard');
  const [stats, setStats] = useState(null);
  useEffect(() => {
    if (!classId) {
      return;
    }

    let isMounted = true;
    setStats(null);
    fetchAdminClassAnalytics(classId)
      .then((data) => {
        if (!isMounted) return;
        setStats({
          ...EMPTY_STATS,
          ...(data ?? {}),
          revenueBreakdown: {
            ...EMPTY_STATS.revenueBreakdown,
            ...(data?.revenueBreakdown ?? {}),
          },
          locations: data?.locations ?? EMPTY_STATS.locations,
          devices: data?.devices ?? EMPTY_STATS.devices,
          registrationTrend: data?.registrationTrend ?? EMPTY_STATS.registrationTrend,
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load analytics", err);
        setStats(EMPTY_STATS);
      });

    return () => {
      isMounted = false;
    };
  }, [classId]);

  if (!stats) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground" dir={i18n.dir()}>
        {t('classAnalyticsPage.loading')}
      </div>
    );
  }

  const totalStudents = stats.totalStudents ?? 0;
  const totalRevenue = stats.totalRevenue ?? 0;
  const totalAttendance = stats.totalAttendance ?? 0;
  const totalCompleted = stats.completed ?? 0;
  const revenueBreakdown = stats.revenueBreakdown ?? EMPTY_STATS.revenueBreakdown;
  const locations = stats.locations ?? EMPTY_STATS.locations;
  const devices = stats.devices ?? EMPTY_STATS.devices;
  const registrationTrend = stats.registrationTrend ?? EMPTY_STATS.registrationTrend;

  const avgRevenue =
    totalStudents > 0
      ? (totalRevenue / totalStudents).toFixed(2)
      : "0";
  const attendanceRate =
    totalStudents > 0
      ? ((totalAttendance / totalStudents) * 100).toFixed(1)
      : "0";
  const completionRate =
    totalStudents > 0
      ? ((totalCompleted / totalStudents) * 100).toFixed(1)
      : "0";

  return (
    <div className="p-6 space-y-6" dir={i18n.dir()}>
      <h1 className="text-2xl font-bold text-gray-800">
        📊 {t('classAnalyticsPage.title')} - {t('classAnalyticsPage.class_id')} {classId}
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">👥 {t('classAnalyticsPage.total_enrolled_students')}</h2>
          <p className="text-3xl font-bold text-green-600">{totalStudents}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">💰 {t('classAnalyticsPage.total_revenue')}</h2>
          <p className="text-3xl font-bold text-indigo-600">${totalRevenue}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">💳 {t('classAnalyticsPage.revenue_breakdown')}</h2>
          <ul className="text-gray-700 space-y-1">
            <li><strong>{t('classAnalyticsPage.full_payments')}:</strong> {revenueBreakdown?.full ?? 0}</li>
            <li><strong>{t('classAnalyticsPage.installments')}:</strong> {revenueBreakdown?.installments ?? 0}</li>
            <li><strong>{t('classAnalyticsPage.free_seats')}:</strong> {revenueBreakdown?.free ?? 0}</li>
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

      <AnalyticsCharts
        t={t}
        locations={locations}
        devices={devices}
        registrationTrend={registrationTrend}
      />
    </div>
  );
}

AnalyticsDashboard.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedAnalyticsDashboard = withAuthProtection(AnalyticsDashboard, {
  roles: ['admin', 'superadmin'],
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
