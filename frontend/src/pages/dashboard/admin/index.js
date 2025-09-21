import { useEffect, useState } from "react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import nextI18NextConfig from "../../../../next-i18next.config.js";
import AdminLayout from "@/components/layouts/AdminLayout";
import useAuthStore from "@/store/auth/authStore";
import withAdminGuard from "@/hooks/withAdminGuard";
import WelcomeBanner from "@/components/admin/WelcomeBanner";
import StatsGrid from "@/components/admin/StatsGrid";
import Link from "next/link";
import { fetchAdminDashboardStats } from "@/services/admin/adminService";
import {
  FaUsers,
  FaChalkboardTeacher,
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
  const [hydrated, setHydrated] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const { t } = useTranslation("dashboard");

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setStatsLoading(true);
      setAlertsLoading(true);
      setFlagsLoading(true);
      setLicenseLoading(true);
      try {
        const [statsRes, alertsRes, flagsRes, licenseRes] = await Promise.allSettled([
          fetchAdminDashboardStats(),
          fetchRecentAlerts(),
          fetchFlaggedMessages(),
          fetchLicenseStatus(),
        ]);

        if (statsRes.status === "fulfilled") {
          setStats(statsRes.value);
        } else {
          console.error("Failed to fetch dashboard stats", statsRes.reason);
          setStats(null);
        }

        if (alertsRes.status === "fulfilled") {
          setAlerts(alertsRes.value);
        } else {
          console.error("Failed to fetch recent alerts", alertsRes.reason);
          setAlerts([]);
        }

        if (flagsRes.status === "fulfilled") {
          setFlaggedMessages(flagsRes.value);
        } else {
          console.error("Failed to fetch flagged messages", flagsRes.reason);
          setFlaggedMessages([]);
        }

        if (licenseRes.status === "fulfilled") {
          setLicenseStatus(licenseRes.value);
        } else {
          console.error("Failed to fetch license status", licenseRes.reason);
          setLicenseStatus(null);
        }
      } finally {
        setStatsLoading(false);
        setAlertsLoading(false);
        setFlagsLoading(false);
        setLicenseLoading(false);
      }
    };
    if (hydrated) {
      loadData();
    }
  }, [hydrated]);

  if (!hydrated || !user) {
    return null;
  }

  const adminName = user?.full_name ?? "Admin";

  const statsArray = stats
    ? [
        {
          icon: <FaUsers aria-hidden="true" />,
          label: t("adminDashboardHome.totalUsers"),
          value: stats.totalUsers,
          color: "text-blue-500",
        },
        {
          icon: <FaChalkboardTeacher aria-hidden="true" />,
          label: t("adminDashboardHome.instructors"),
          value: stats.instructors,
          color: "text-purple-500",
        },
        {
          icon: <FaUsers aria-hidden="true" />,
          label: t("adminDashboardHome.students"),
          value: stats.students,
          color: "text-green-500",
        },
        {
          icon: <FaBook aria-hidden="true" />,
          label: t("adminDashboardHome.tutorials"),
          value: stats.tutorials,
          color: "text-indigo-500",
        },
        {
          icon: <FaVideo aria-hidden="true" />,
          label: t("adminDashboardHome.classes"),
          value: stats.classes,
          color: "text-yellow-500",
        },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10">
      <WelcomeBanner name={user?.full_name ?? "Admin"} />

      {/* Alerts Summary */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">
            <span aria-hidden="true">🚨</span> {t("adminDashboardHome.recentAlerts")}
          </h3>
          {alertsLoading ? (
            <p className="text-sm">{t("adminDashboardHome.loadingAlerts")}</p>
          ) : alerts.length === 0 ? (
            <p className="text-sm text-gray-600">{t("adminDashboardHome.noAlerts")}</p>
          ) : (
            <ul className="text-sm text-red-600 space-y-1">
              {alerts.slice(0, 3).map((alert, idx) => (
                <li key={idx}>{alert.message || alert}</li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/alerts"
            className="text-yellow-500 text-sm mt-2 inline-block hover:underline"
          >
            {t("adminDashboardHome.viewAllAlerts")}
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">
            <span aria-hidden="true">🛡️</span> {t("adminDashboardHome.flaggedMessages")}
          </h3>
          {flagsLoading ? (
            <p className="text-sm">{t("adminDashboardHome.loadingMessages")}</p>
          ) : flaggedMessages.length === 0 ? (
            <p className="text-sm text-gray-600">{t("adminDashboardHome.noFlaggedMessages")}</p>
          ) : (
            <ul className="text-sm text-red-500 space-y-1">
              {flaggedMessages.slice(0, 2).map((msg) => (
                <li key={msg.id || msg}>
                  @{msg.user || msg.username}: “{msg.content || msg.message}”
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/moderation"
            className="text-yellow-500 text-sm mt-2 inline-block hover:underline"
          >
            {t("adminDashboardHome.reviewMessages")}
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">
            <span aria-hidden="true">🔒</span> {t("adminDashboardHome.licenseCheck")}
          </h3>
          {licenseLoading ? (
            <p className="text-sm">{t("adminDashboardHome.checkingLicense")}</p>
          ) : licenseStatus ? (
            <>
              <p className="text-sm text-gray-800">
                {t("adminDashboardHome.lastCheck", {
                  value:
                    licenseStatus.last_check || t("adminDashboardHome.notAvailable"),
                })}
              </p>
              <p
                className={`text-sm mt-1 ${
                  licenseStatus.unauthorized_count ? "text-red-600" : "text-green-600"
                }`}
              >
                  {licenseStatus.unauthorized_count
                    ? t("adminDashboardHome.unauthorizedInstances", {
                        count: licenseStatus.unauthorized_count,
                      })
                    : t("adminDashboardHome.noUnauthorizedInstances")}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600">{t("adminDashboardHome.noLicenseData")}</p>
          )}
          <Link
            href="/admin/license-logs"
            className="text-yellow-500 text-sm mt-2 inline-block hover:underline"
          >
            {t("adminDashboardHome.seeDetails")}
          </Link>
        </div>
      </section>

      {/* Charts & Stats */}
      <section>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RevenueChart data={stats?.monthlyRevenue} />
          <SignupsChart data={stats?.monthlySignups} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          <CategoryPieChart data={stats?.tutorialsByCategory} />
          <InstructorActivityChart data={stats?.instructorTutorialCount} />
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">
          <span aria-hidden="true">📊</span> {t("adminDashboardHome.platformInsights")}
        </h2>
        {statsLoading ? (
          <p>{t("adminDashboardHome.loadingStats")}</p>
        ) : (
          <StatsGrid stats={statsArray} />
        )}
      </section>
    </div>
  );
}

const ProtectedAdminDashboard = withAdminGuard(AdminDashboardHome);

ProtectedAdminDashboard.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default ProtectedAdminDashboard;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "dashboard"], nextI18NextConfig)),
    },
  };
}

