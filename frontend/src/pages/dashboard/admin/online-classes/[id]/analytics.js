// pages/dashboard/admin/online-classes/[id]/analytics.js
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import { fetchAdminClassAnalytics } from "@/services/admin/classService";

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
  const [chartsLib, setChartsLib] = useState(null);
  const [resizeObserverSupported, setResizeObserverSupported] = useState(true);
  const [chartsLoadError, setChartsLoadError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!window.ResizeObserver) {
      setResizeObserverSupported(false);
      return;
    }

    let isMounted = true;
    import("recharts")
      .then((module) => {
        if (!isMounted) return;
        setChartsLib(module);
      })
      .catch((error) => {
        console.error("Failed to load Recharts", error);
        if (!isMounted) return;
        setChartsLoadError(true);
        setChartsLib(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchAdminClassAnalytics(id)
      .then((data) =>
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
        })
      )
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

  const totalStudents = stats.totalStudents ?? 0;
  const totalRevenue = stats.totalRevenue ?? 0;
  const totalAttendance = stats.totalAttendance ?? 0;
  const totalCompleted = stats.completed ?? 0;
  const revenueBreakdown = stats.revenueBreakdown ?? EMPTY_STATS.revenueBreakdown;
  const locations = stats.locations ?? EMPTY_STATS.locations;
  const devices = stats.devices ?? EMPTY_STATS.devices;
  const registrationTrend = stats.registrationTrend ?? EMPTY_STATS.registrationTrend;
  const ResponsiveContainer = chartsLib?.ResponsiveContainer;
  const PieChart = chartsLib?.PieChart;
  const Pie = chartsLib?.Pie;
  const Cell = chartsLib?.Cell;
  const Legend = chartsLib?.Legend;
  const Tooltip = chartsLib?.Tooltip;
  const BarChart = chartsLib?.BarChart;
  const Bar = chartsLib?.Bar;
  const XAxis = chartsLib?.XAxis;
  const YAxis = chartsLib?.YAxis;
  const CartesianGrid = chartsLib?.CartesianGrid;

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
        📊 {t('classAnalyticsPage.title')} - {t('classAnalyticsPage.class_id')} {id}
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

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">🌍 {t('classAnalyticsPage.top_countries')}</h2>
          {resizeObserverSupported && ResponsiveContainer && PieChart ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={locations} dataKey="value" nameKey="name" outerRadius={100}>
                  {(locations ?? []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
              {resizeObserverSupported
                ? chartsLoadError
                  ? t(
                      'classAnalyticsPage.chartsFailedToLoad',
                      'Charts failed to load. Please refresh to try again.'
                    )
                  : t('classAnalyticsPage.loadingCharts', 'Loading charts…')
                : t(
                    'classAnalyticsPage.chartsUnavailableResizeObserver',
                    'Charts are unavailable because ResizeObserver is not supported in this browser.'
                  )}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">📱 {t('classAnalyticsPage.devices_used')}</h2>
          {resizeObserverSupported && ResponsiveContainer && PieChart ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={devices} dataKey="value" nameKey="name" outerRadius={100}>
                  {(devices ?? []).map((entry, index) => (
                    <Cell key={`cell-dev-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
              {resizeObserverSupported
                ? chartsLoadError
                  ? t(
                      'classAnalyticsPage.chartsFailedToLoad',
                      'Charts failed to load. Please refresh to try again.'
                    )
                  : t('classAnalyticsPage.loadingCharts', 'Loading charts…')
                : t(
                    'classAnalyticsPage.chartsUnavailableResizeObserver',
                    'Charts are unavailable because ResizeObserver is not supported in this browser.'
                  )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">📈 {t('classAnalyticsPage.registration_trend')}</h2>
        {resizeObserverSupported && ResponsiveContainer && BarChart ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={registrationTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="students" fill="#facc15" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
            {resizeObserverSupported
              ? chartsLoadError
                ? t(
                    'classAnalyticsPage.chartsFailedToLoad',
                    'Charts failed to load. Please refresh to try again.'
                  )
                : t('classAnalyticsPage.loadingCharts', 'Loading charts…')
              : t(
                  'classAnalyticsPage.chartsUnavailableResizeObserver',
                  'Charts are unavailable because ResizeObserver is not supported in this browser.'
                )}
          </div>
        )}
      </div>
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
