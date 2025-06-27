import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import Link from "next/link";
import {
  FaCommentDots,
  FaExclamationTriangle,
  FaUsers,
  FaBullhorn,
  FaCogs,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { fetchDashboardStats } from "@/services/admin/communityService";

const NavCard = ({ href, icon, label }) => (
  <Link href={href}>
    <div className="bg-white hover:bg-gray-100 transition p-5 rounded-xl cursor-pointer shadow border border-gray-200 flex items-center gap-4">
      <div className="text-3xl text-yellow-500">{icon}</div>
      <div className="text-base font-semibold text-gray-800">{label}</div>
    </div>
  </Link>
);

const StatCard = ({ label, value, color }) => (
  <div className={`rounded-lg p-5 text-white shadow flex flex-col gap-1 ${color}`}>
    <span className="text-sm uppercase tracking-wide font-medium">{label}</span>
    <span className="text-2xl font-bold">{value}</span>
  </div>
);

export default function AdminCommunityDashboard() {
  const [stats, setStats] = useState(null);
  const [activityData, setActivityData] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchDashboardStats();
        if (data) {
          setStats({
            totalDiscussions: data.totalDiscussions,
            pendingReports: data.pendingReports,
            contributors: data.contributors,
            repliesThisWeek: data.repliesThisWeek,
            topContributor: data.topContributor || {},
          });
          setActivityData(data.activityData || []);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };
    load();
  }, []);

  if (!stats) {
    return (
      <AdminLayout title="Community Dashboard">
        <div className="p-6">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Community Dashboard">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Community Dashboard</h1>
          <p className="text-gray-500 text-sm">
            Moderate discussions, manage contributors, and configure community-wide features.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <StatCard label="Discussions" value={stats.totalDiscussions} color="bg-yellow-500" />
          <StatCard label="Pending Reports" value={stats.pendingReports} color="bg-red-500" />
          <StatCard label="Contributors" value={stats.contributors} color="bg-blue-500" />
          <StatCard label="Replies This Week" value={stats.repliesThisWeek} color="bg-green-500" />
        </div>

        {/* Navigation Cards */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">Manage Community Sections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <NavCard href="/dashboard/admin/community/discussions" label="Manage Discussions" icon={<FaCommentDots />} />
          <NavCard href="/dashboard/admin/community/reports" label="Reported Posts" icon={<FaExclamationTriangle />} />
          <NavCard href="/dashboard/admin/community/tags" label="Manage Tags" icon={<FaCogs />} />
          <NavCard href="/dashboard/admin/community/contributors" label="Top Contributors" icon={<FaUsers />} />
          <NavCard href="/dashboard/admin/community/announcements" label="Post Announcement" icon={<FaBullhorn />} />
          <NavCard href="/dashboard/admin/community/settings" label="Community Settings" icon={<FaCogs />} />
        </div>

        {/* Top Contributor */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-10">
          <h3 className="text-lg font-semibold mb-3">🏆 Top Contributor</h3>
          <div className="flex items-center gap-4">
            <img
              src={stats.topContributor.avatar || "/images/default-avatar.png"}
              alt={stats.topContributor.name}
              className="w-12 h-12 rounded-full border"
            />
            <div>
              <p className="font-bold text-gray-800">{stats.topContributor.name}</p>
              <p className="text-sm text-gray-500">
                {stats.topContributor.contributions} contributions • {stats.topContributor.reputation} reputation
              </p>
            </div>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">📈 Community Activity (Last 5 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="discussions" stroke="#F59E0B" name="Discussions" />
              <Line type="monotone" dataKey="reports" stroke="#EF4444" name="Reports" />
              <Line type="monotone" dataKey="replies" stroke="#10B981" name="Replies" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminLayout>
  );
}
