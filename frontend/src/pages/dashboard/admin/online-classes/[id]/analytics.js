// pages/dashboard/admin/online-classes/[id]/analytics.js
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useEffect, useState } from "react";
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

export default function AnalyticsDashboard() {
  const router = useRouter();
  const { id } = router.query;
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchAdminClassAnalytics(id)
      .then((data) => setStats(data))
      .catch((err) => {
        console.error("Failed to load analytics", err);
        setStats(null);
      });
  }, [id]);

  if (!stats) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
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
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">📊 Analytics - Class ID: {id}</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">👥 Total Enrolled Students</h2>
          <p className="text-3xl font-bold text-green-600">{stats.totalStudents}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">💰 Total Revenue</h2>
          <p className="text-3xl font-bold text-indigo-600">${stats.totalRevenue}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">💳 Revenue Breakdown</h2>
          <ul className="text-gray-700 space-y-1">
            <li><strong>Full Payments:</strong> {stats.revenueBreakdown.full}</li>
            <li><strong>Installments:</strong> {stats.revenueBreakdown.installments}</li>
            <li><strong>Free Seats:</strong> {stats.revenueBreakdown.free}</li>
          </ul>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">📊 Avg Revenue Per Student</h2>
          <p className="text-3xl font-bold text-yellow-600">${avgRevenue}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">✅ Attendance Rate</h2>
          <p className="text-3xl font-bold text-blue-600">{attendanceRate}%</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">🎯 Completion Rate</h2>
          <p className="text-3xl font-bold text-purple-600">{completionRate}%</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">🌍 Top Countries</h2>
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
          <h2 className="text-lg font-semibold text-gray-700 mb-4">📱 Devices Used</h2>
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
        <h2 className="text-lg font-semibold text-gray-700 mb-4">📈 Registration Trend</h2>
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