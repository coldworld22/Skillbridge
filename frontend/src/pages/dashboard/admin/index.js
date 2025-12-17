import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import nextI18NextConfig from "../../../../next-i18next.config.js";
import AdminLayout from "@/components/layouts/AdminLayout";
import useAuthStore from "@/store/auth/authStore";
import withAuthProtection from "@/hooks/withAuthProtection";
import usePermission from "@/hooks/usePermission";
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
  const router = useRouter();
  const { can } = usePermission();
  const canViewDashboard = can("view_admin_dashboard");
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
    if (!hydrated) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (!canViewDashboard) {
      router.replace("/error/403");
    }
  }, [user, hydrated, router, canViewDashboard]);

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
    if (hydrated && user && canViewDashboard) {
      loadData();
    }
  }, [hydrated, user, canViewDashboard]);

  if (!hydrated || !user || !canViewDashboard) {
    return null;
  }

  const statsArray = stats
    ? [
        { icon: <FaUsers aria-hidden="true" />, label: "Total Users", value: stats.totalUsers, color: "text-blue-500" },
        { icon: <FaChalkboardTeacher aria-hidden="true" />, label: "Instructors", value: stats.instructors, color: "text-purple-500" },
        { icon: <FaUsers aria-hidden="true" />, label: "Students", value: stats.students, color: "text-green-500" },
        { icon: <FaBook aria-hidden="true" />, label: "Tutorials", value: stats.tutorials, color: "text-indigo-500" },
        { icon: <FaVideo aria-hidden="true" />, label: "Classes", value: stats.classes, color: "text-yellow-500" },
      ]
    : [];

  const planSubscriptions = Array.isArray(stats?.planSubscriptions)
    ? stats.planSubscriptions
    : [];

  const formatCurrency = (amount, currency) => {
    if (amount === null || amount === undefined) return null;
    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount)) return null;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency || "USD",
        minimumFractionDigits: Number.isInteger(numericAmount) ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(numericAmount);
    } catch (err) {
      return `${numericAmount.toFixed(2)} ${currency || ""}`.trim();
    }
  };

  const getPlanPricingSummary = (plan) => {
    if (!plan) return t("planOverviewFreeLabel");
    if (plan.priceMonthly === null || plan.priceMonthly === undefined) {
      return t("planOverviewPricingUnavailable");
    }
    if (Number(plan.priceMonthly) === 0) {
      return t("planOverviewFreeLabel");
    }
    const monthly = formatCurrency(plan.priceMonthly, plan.currency);
    const yearly = formatCurrency(plan.priceYearly, plan.currency);
    if (monthly && yearly) {
      return t("planOverviewPriceSummary", { monthly, yearly });
    }
    if (monthly) {
      return t("planOverviewPriceMonthlyOnly", { monthly });
    }
    return t("planOverviewFreeLabel");
  };

  const getPlanRoleLabel = (role) => {
    if (!role) return t("planOverviewRoleGeneral");
    const normalized = String(role).toLowerCase();
    if (normalized === "student") return t("planOverviewRoleStudent");
    if (normalized === "instructor") return t("planOverviewRoleInstructor");
    return t("planOverviewRoleGeneral");
  };

  const formatCount = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) return "0";
    return Math.round(numeric).toLocaleString();
  };

  const toSafeNumber = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const isHexColor = (value) =>
    typeof value === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());

  const hexToRgba = (hex, alpha = 1) => {
    if (!isHexColor(hex)) {
      return `rgba(37, 99, 235, ${alpha})`;
    }
    let normalized = hex.trim().replace("#", "");
    if (normalized.length === 3) {
      normalized = normalized
        .split("")
        .map((char) => char + char)
        .join("");
    }
    const int = parseInt(normalized, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const resolvePlanAccent = (plan) => {
    const style = plan?.style || {};
    const gradientStart = style.gradientStart || plan?.color || "#3B82F6";
    const gradientEnd = style.gradientEnd || gradientStart;
    const accentColor = style.buttonColor || gradientEnd || gradientStart || "#2563EB";
    return {
      gradient: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
      accentColor,
      badgeBg: hexToRgba(accentColor, 0.12),
      badgeBorder: hexToRgba(accentColor, 0.3),
    };
  };

  const planTotals = planSubscriptions.reduce(
    (acc, plan) => {
      acc.active += toSafeNumber(plan?.subscribers?.active);
      acc.new += toSafeNumber(plan?.subscribers?.newThisMonth);
      acc.expiring += toSafeNumber(plan?.subscribers?.expiringSoon);
      acc.cancelled += toSafeNumber(plan?.subscribers?.cancelledThisMonth);
      return acc;
    },
    { active: 0, new: 0, expiring: 0, cancelled: 0 }
  );

  const revenueChartData = Array.isArray(stats?.monthlyRevenue) ? stats.monthlyRevenue : [];
  const revenueCurrency = stats?.monthlyRevenueCurrency || "USD";
  const signupsChartData = Array.isArray(stats?.monthlySignups) ? stats.monthlySignups : [];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10">
      <WelcomeBanner name={user.full_name || "Admin"} />

      {/* Key Signals */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">
            <span aria-hidden="true">🚨</span> {t("recentAlerts")}
          </h3>
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
          <Link
            href="/admin/alerts"
            className="text-yellow-500 text-sm mt-2 inline-block hover:underline"
          >
            View all alerts
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">
            <span aria-hidden="true">🛡️</span> {t("flaggedMessages")}
          </h3>
          {flagsLoading ? (
            <p className="text-sm">Loading messages...</p>
          ) : flaggedMessages.length === 0 ? (
            <p className="text-sm text-gray-600">No flagged messages</p>
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
            Review messages
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">
            <span aria-hidden="true">🔒</span> {t("licenseCheck")}
          </h3>
          {licenseLoading ? (
            <p className="text-sm">Checking license...</p>
          ) : licenseStatus ? (
            <>
              <p className="text-sm text-gray-800">
                Last check: {licenseStatus.last_check || "N/A"}
              </p>
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
          <Link
            href="/admin/license-logs"
            className="text-yellow-500 text-sm mt-2 inline-block hover:underline"
          >
            See details
          </Link>
        </div>
      </section>

      {/* Plan Performance */}
      <section className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              <span aria-hidden="true">📦</span> {t("planOverviewTitle")}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {t("planOverviewSubtitle")}
            </p>
          </div>
            <Link
              href="/dashboard/admin/plans"
              className="inline-flex items-center text-sm font-medium text-yellow-500 hover:text-yellow-600 hover:underline"
            >
              {t("planOverviewManageLink")}
            </Link>
        </div>
        {statsLoading ? (
          <p className="mt-6 text-sm text-slate-600">{t("planOverviewLoading")}</p>
        ) : planSubscriptions.length === 0 ? (
          <p className="mt-6 text-sm text-slate-600">{t("planOverviewEmpty")}</p>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("planOverviewTotalActive")}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {formatCount(planTotals.active)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("planOverviewTotalNew")}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {formatCount(planTotals.new)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("planOverviewTotalExpiring")}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {formatCount(planTotals.expiring)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("planOverviewTotalCancelled")}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {formatCount(planTotals.cancelled)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {planSubscriptions.map((plan) => {
                const { accentColor, badgeBg, badgeBorder, gradient } =
                  resolvePlanAccent(plan);

                return (
                  <article
                    key={plan.id}
                    className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-1.5"
                      style={{ background: gradient }}
                    />
                    <div className="relative p-5 pt-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {getPlanRoleLabel(plan.targetRole)}
                          </p>
                          <h4 className="mt-1 text-lg font-semibold text-slate-900">
                            {plan.name}
                          </h4>
                        </div>
                        <span
                          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold"
                          style={{
                            color: accentColor,
                            backgroundColor: badgeBg,
                            borderColor: badgeBorder,
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: accentColor }}
                          />
                          {t("planStatActiveLabelShort", {
                            count: formatCount(plan.subscribers?.active),
                          })}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        {getPlanPricingSummary(plan)}
                      </p>
                      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 text-sm text-slate-600">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {t("planStatActiveLabel")}
                          </p>
                          <p className="mt-1 text-xl font-semibold text-slate-900">
                            {formatCount(plan.subscribers?.active)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {t("planStatNewLabel")}
                          </p>
                          <p className="mt-1 text-xl font-semibold text-slate-900">
                            {formatCount(plan.subscribers?.newThisMonth)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {t("planStatExpiringLabel")}
                          </p>
                          <p className="mt-1 text-xl font-semibold text-slate-900">
                            {formatCount(plan.subscribers?.expiringSoon)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {t("planStatCancelledLabel")}
                          </p>
                          <p className="mt-1 text-xl font-semibold text-slate-900">
                            {formatCount(plan.subscribers?.cancelledThisMonth)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Charts & Stats */}
      <section>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RevenueChart data={revenueChartData} currency={revenueCurrency} />
          <SignupsChart data={signupsChartData} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          <CategoryPieChart data={stats?.tutorialsByCategory} />
          <InstructorActivityChart data={stats?.instructorTutorialCount} />
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">
          <span aria-hidden="true">📊</span> {t("platformInsights")}
        </h2>
        {statsLoading ? (
          <p>{t("loadingStats")}</p>
        ) : (
          <StatsGrid stats={statsArray} />
        )}
      </section>
    </div>
  );
}

const ProtectedAdminDashboard = withAuthProtection(AdminDashboardHome, {
  permissions: ["view_admin_dashboard"],
});

ProtectedAdminDashboard.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default ProtectedAdminDashboard;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "dashboard"], nextI18NextConfig)),
    },
  };
}
