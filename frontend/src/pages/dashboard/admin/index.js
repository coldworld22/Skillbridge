import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../next-i18next.config.js";
import AdminLayout from "@/components/layouts/AdminLayout";
import useAuthStore from "@/store/auth/authStore";
import withAuthProtection from "@/hooks/withAuthProtection";
import WelcomeBanner from "@/components/admin/WelcomeBanner";
import StatsGrid from "@/components/admin/StatsGrid";
import Link from "next/link";
import { fetchAdminDashboardStats } from "@/services/admin/adminService";
import { FaUsers, FaChalkboardTeacher, FaBook, FaVideo } from "react-icons/fa";
import RevenueChart from "@/components/admin/charts/RevenueChart";
import SignupsChart from "@/components/admin/charts/SignupsChart";
import CategoryPieChart from "@/components/admin/charts/CategoryPieChart";
import InstructorActivityChart from "@/components/admin/charts/InstructorActivityChart";

function AdminDashboardHome() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(null);

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
    if (hydrated && user && ["admin", "superadmin"].includes(user.role?.toLowerCase())) {
      loadStats();
    }
  }, [hydrated, user, loadStats]);

  if (!hydrated || !user || !["admin", "superadmin"].includes(user.role?.toLowerCase())) {
    return null;
  }

  const statsArray = stats
    ? [
        { icon: <FaUsers />, label: "Total Users", value: stats.totalUsers, color: "text-blue-500" },
        { icon: <FaChalkboardTeacher />, label: "Instructors", value: stats.instructors, color: "text-purple-500" },
        { icon: <FaUsers />, label: "Students", value: stats.students, color: "text-green-500" },
        { icon: <FaBook />, label: "Tutorials", value: stats.tutorials, color: "text-indigo-500" },
        { icon: <FaVideo />, label: "Classes", value: stats.classes, color: "text-yellow-500" },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10">
      <WelcomeBanner name={user.full_name || "Admin"} />

      {/* Alerts Summary */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">🚨 Recent Alerts</h3>
          <ul className="text-sm text-red-600 space-y-1">
            <li>Unauthorized usage detected</li>
            <li>Flagged chat in Python class</li>
            <li>API key expiring soon</li>
          </ul>
          <Link href="/admin/alerts" className="text-yellow-500 text-sm mt-2 inline-block hover:underline">View all alerts</Link>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">🛡️ Flagged Messages</h3>
          <ul className="text-sm text-red-500 space-y-1">
            <li>@ayman: “This is stupid”</li>
            <li>@maria: “Dumb answer...”</li>
          </ul>
          <Link href="/admin/moderation" className="text-yellow-500 text-sm mt-2 inline-block hover:underline">Review messages</Link>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">🔒 License Check</h3>
          <p className="text-sm text-gray-800">Last check: 1 hour ago</p>
          <p className="text-sm text-red-600 mt-1">❌ 1 unauthorized instance detected</p>
          <Link href="/admin/license-logs" className="text-yellow-500 text-sm mt-2 inline-block hover:underline">See details</Link>
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

        <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">📊 Platform Insights</h2>
        {error ? (
          <div className="text-red-600">
            <p>{error}</p>
            <button
              onClick={loadStats}
              className="mt-2 text-sm text-blue-500 underline"
            >
              Retry
            </button>
          </div>
        ) : statsLoading ? (
          <p>Loading stats...</p>
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

