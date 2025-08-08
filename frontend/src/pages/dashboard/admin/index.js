import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import nextI18NextConfig from "../../../../next-i18next.config.js";
import AdminLayout from "@/components/layouts/AdminLayout";
import useAuthStore from "@/store/auth/authStore";
import withAuthProtection from "@/hooks/withAuthProtection";
import WelcomeBanner from "@/components/admin/WelcomeBanner";
import StatsGrid from "@/components/admin/StatsGrid";
import Link from "next/link";
import { fetchAdminDashboardStats } from "@/services/admin/adminService";
import {
  FaUsers,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaBook,
  FaVideo,
} from "react-icons/fa";
import RevenueChart from "@/components/admin/charts/RevenueChart";
import SignupsChart from "@/components/admin/charts/SignupsChart";
import CategoryPieChart from "@/components/admin/charts/CategoryPieChart";
import InstructorActivityChart from "@/components/admin/charts/InstructorActivityChart";
import { fetchRecentAlerts } from "@/services/admin/alertService";
import { fetchFlaggedMessages } from "@/services/admin/moderationService";
import { fetchLicenseStatus } from "@/services/admin/licenseService";

function AdminDashboardHome() {
  const { user } = useAuthStore();
  const { t } = useTranslation(['common', 'dashboard']);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [licenseLoading, setLicenseLoading] = useState(false);

  // Wait for hydration to access Zustand state safely
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      if (!user) {
        router.replace("/auth/login");
      } else if (!["admin", "superadmin"].includes(user.role?.toLowerCase())) {
        router.replace("/error/403");
      }
    }
  }, [user, hydrated]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
      setError(err.message || "Failed to load dashboard stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setStatsLoading(true);
      setAlertsLoading(true);
      setFlagsLoading(true);
      setLicenseLoading(true);
      try {
        const [statsData, alertsData, flagsData, licenseData] = await Promise.all([
          fetchAdminDashboardStats(),
          fetchRecentAlerts(),
          fetchFlaggedMessages(),
          fetchLicenseStatus(),
        ]);
        setStats(statsData);
        setAlerts(alertsData);
        setFlaggedMessages(flagsData);
        setLicenseStatus(licenseData);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setStatsLoading(false);
        setAlertsLoading(false);
        setFlagsLoading(false);
        setLicenseLoading(false);
      }
    };
    if (hydrated && user && ["admin", "superadmin"].includes(user.role?.toLowerCase())) {
      loadData();
    }
  }, [hydrated, user, loadStats]);

    loadStats();
  }, []);

  const statsArray = useMemo(
    () =>
      stats
        ? [
            { icon: <FaUsers />, label: "Total Users", value: stats.totalUsers, color: "text-blue-500" },
            { icon: <FaChalkboardTeacher />, label: "Instructors", value: stats.instructors, color: "text-purple-500" },
            { icon: <FaUserGraduate />, label: "Students", value: stats.students, color: "text-green-500" },
            { icon: <FaBook />, label: "Tutorials", value: stats.tutorials, color: "text-indigo-500" },
            { icon: <FaVideo />, label: "Classes", value: stats.classes, color: "text-yellow-500" },
          ]
        : [],
    [stats]
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10">
      <WelcomeBanner name={user.full_name || "Admin"} />

      {/* Alerts Summary */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">🚨 Recent Alerts</h3>
          {alertsLoading ? (
            <p className="text-sm">Loading alerts...</p>
          ) : alerts.length === 0 ? (
            <p className="text-sm text-gray-600">No alerts</p>
          ) : (
            <ul className="text-sm text-red-600 space-y-1">
              {alerts.slice(0, 3).map((alert, idx) => (
                <li key={idx}>{alert.message || alert}</li>
              ))}
            </ul>
          )}
          <Link href="/admin/alerts" className="text-yellow-500 text-sm mt-2 inline-block hover:underline">
            View all alerts
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">🛡️ Flagged Messages</h3>
          {flagsLoading ? (
            <p className="text-sm">Loading messages...</p>
          ) : flaggedMessages.length === 0 ? (
            <p className="text-sm text-gray-600">No flagged messages</p>
          ) : (
            <ul className="text-sm text-red-500 space-y-1">
              {flaggedMessages.slice(0, 2).map((msg) => (
                <li key={msg.id || msg}>@{msg.user || msg.username}: “{msg.content || msg.message}”</li>
              ))}
            </ul>
          )}
          <Link href="/admin/moderation" className="text-yellow-500 text-sm mt-2 inline-block hover:underline">
            Review messages
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">🔒 License Check</h3>
          {licenseLoading ? (
            <p className="text-sm">Checking license...</p>
          ) : licenseStatus ? (
            <>
              <p className="text-sm text-gray-800">Last check: {licenseStatus.last_check || "N/A"}</p>
              <p
                className={`text-sm mt-1 ${
                  licenseStatus.unauthorized_count ? "text-red-600" : "text-green-600"
                }`}
              >
                {licenseStatus.unauthorized_count
                  ? `❌ ${licenseStatus.unauthorized_count} unauthorized instance${
                      licenseStatus.unauthorized_count > 1 ? "s" : ""
                    } detected`
                  : "✅ No unauthorized instances"}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600">No license data</p>
          )}
          <Link href="/admin/license-logs" className="text-yellow-500 text-sm mt-2 inline-block hover:underline">
            See details
          </Link>
        </div>
      </section>

      {/* Charts & Stats */}
      <section>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <RevenueChart />
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <SignupsChart />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-xl shadow p-6">
            <CategoryPieChart />
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <InstructorActivityChart />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">📊 {t('platformInsights')}</h2>
        {statsLoading ? (
          <p>{t('loadingStats')}</p>
        ) : (
          <StatsGrid stats={statsArray} />
        )}
      </section>

    </div>
  );
}

const ProtectedAdminDashboard = withAuthProtection(AdminDashboardHome, ["admin", "superadmin"]);

ProtectedAdminDashboard.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default ProtectedAdminDashboard;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'dashboard'], nextI18NextConfig)),
    },
  };
}

