import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import useAuthStore from "@/store/auth/authStore";
import withAuthProtection from "@/hooks/withAuthProtection";
import WelcomeBanner from "@/components/admin/WelcomeBanner";
import StatsGrid from "@/components/admin/StatsGrid";
import { fetchAdminDashboardStats } from "@/services/admin/adminService";
import { FaUsers, FaChalkboardTeacher, FaBook, FaVideo } from "react-icons/fa";
import PendingApprovals from "@/components/admin/PendingApprovals";
import RecentActivity from "@/components/admin/RecentActivity";
import ManagementShortcuts from "@/components/admin/ManagementShortcuts";
import RevenueChart from "@/components/admin/charts/RevenueChart";
import SignupsChart from "@/components/admin/charts/SignupsChart";
import CategoryPieChart from "@/components/admin/charts/CategoryPieChart";
import InstructorActivityChart from "@/components/admin/charts/InstructorActivityChart";
import SystemWarnings from "@/components/admin/widgets/SystemWarnings";
import UpcomingEvents from "@/components/admin/widgets/UpcomingEvents";
import MiniAuditLog from "@/components/admin/widgets/MiniAuditLog";

function AdminDashboardHome() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [stats, setStats] = useState(null);

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

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchAdminDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      }
    };
    if (hydrated && user && ["admin", "superadmin"].includes(user.role?.toLowerCase())) {
      loadStats();
    }
  }, [hydrated, user]);

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
          <a href="/admin/alerts" className="text-yellow-500 text-sm mt-2 inline-block hover:underline">View all alerts</a>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">🛡️ Flagged Messages</h3>
          <ul className="text-sm text-red-500 space-y-1">
            <li>@ayman: “This is stupid”</li>
            <li>@maria: “Dumb answer...”</li>
          </ul>
          <a href="/admin/moderation" className="text-yellow-500 text-sm mt-2 inline-block hover:underline">Review messages</a>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">🔒 License Check</h3>
          <p className="text-sm text-gray-800">Last check: 1 hour ago</p>
          <p className="text-sm text-red-600 mt-1">❌ 1 unauthorized instance detected</p>
          <a href="/admin/license-logs" className="text-yellow-500 text-sm mt-2 inline-block hover:underline">See details</a>
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
        <StatsGrid stats={statsArray} />
      </section>

      {/* Approvals + Shortcuts */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <PendingApprovals />
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <ManagementShortcuts />
        </div>
      </section>

      {/* System Monitoring */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <SystemWarnings />
        <UpcomingEvents />
        <MiniAuditLog />
      </section>

      {/* Activity Feed */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📰 Recent Activity</h2>
        <div className="bg-white rounded-xl shadow p-6 max-h-96 overflow-y-auto">
          <RecentActivity />
        </div>
      </section>
    </div>
  );
}

const ProtectedAdminDashboard = withAuthProtection(AdminDashboardHome, ["admin", "superadmin"]);

ProtectedAdminDashboard.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default ProtectedAdminDashboard;