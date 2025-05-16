// pages/dashboard/admin/index.js
import AdminLayout from "@/components/layouts/AdminLayout";
import WelcomeBanner from "@/components/admin/WelcomeBanner";
import StatsGrid from "@/components/admin/StatsGrid";
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
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10">
      {/* Welcome Banner */}
      <WelcomeBanner name="Admin" />

      {/* Security Summary Alerts */}
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

      {/* Platform Insights: Stats + Charts */}
      <section>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6 h-full">
            <RevenueChart />
          </div>
          <div className="bg-white rounded-xl shadow p-6 h-full">
            <SignupsChart />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-xl shadow p-6 h-full">
            <CategoryPieChart />
          </div>
          <div className="bg-white rounded-xl shadow p-6 h-full">
            <InstructorActivityChart />
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Platform Insights</h2>
        <div className="mb-6">
          <StatsGrid />
        </div>

       
      </section>

      {/* Pending + Shortcuts side by side */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <PendingApprovals />
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <ManagementShortcuts />
        </div>
      </section>

      {/* System Monitor Widgets */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <SystemWarnings />
        <UpcomingEvents />
        <MiniAuditLog />
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📰 Recent Activity</h2>
        <div className="bg-white rounded-xl shadow p-6 max-h-96 overflow-y-auto">
          <RecentActivity />
        </div>
      </section>
    </div>
  );
}

AdminDashboardHome.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default AdminDashboardHome;
