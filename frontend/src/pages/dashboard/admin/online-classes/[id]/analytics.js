// pages/dashboard/admin/online-classes/[id]/analytics.js
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";

const mockAnalytics = {
  totalStudents: 42,
  totalRevenue: 2100,
  totalAttendance: 30,
  completed: 25,
  revenueBreakdown: {
    full: 30,
    installments: 10,
    free: 2
  },
  locations: [
    { name: "Saudi Arabia", value: 20 },
    { name: "Egypt", value: 10 },
    { name: "UAE", value: 5 },
    { name: "Other", value: 7 },
  ],
  devices: [
    { name: "Desktop", value: 28 },
    { name: "Mobile", value: 14 }
  ],
  registrationTrend: [
    { date: "Apr 1", students: 5 },
    { date: "Apr 5", students: 8 },
    { date: "Apr 10", students: 12 },
    { date: "Apr 15", students: 17 },
  ],
};

const COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f87171"];

export default function AnalyticsDashboard() {
  const router = useRouter();
  const { id } = router.query;

  const avgRevenue = (mockAnalytics.totalRevenue / mockAnalytics.totalStudents).toFixed(2);
  const attendanceRate = ((mockAnalytics.totalAttendance / mockAnalytics.totalStudents) * 100).toFixed(1);
  const completionRate = ((mockAnalytics.completed / mockAnalytics.totalStudents) * 100).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">📊 Analytics - Class ID: {id}</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">👥 Total Enrolled Students</h2>
          <p className="text-3xl font-bold text-green-600">{mockAnalytics.totalStudents}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">💰 Total Revenue</h2>
          <p className="text-3xl font-bold text-indigo-600">${mockAnalytics.totalRevenue}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">💳 Revenue Breakdown</h2>
          <ul className="text-gray-700 space-y-1">
            <li><strong>Full Payments:</strong> {mockAnalytics.revenueBreakdown.full}</li>
            <li><strong>Installments:</strong> {mockAnalytics.revenueBreakdown.installments}</li>
            <li><strong>Free Seats:</strong> {mockAnalytics.revenueBreakdown.free}</li>
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
              <Pie data={mockAnalytics.locations} dataKey="value" nameKey="name" outerRadius={100}>
                {mockAnalytics.locations.map((entry, index) => (
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
              <Pie data={mockAnalytics.devices} dataKey="value" nameKey="name" outerRadius={100}>
                {mockAnalytics.devices.map((entry, index) => (
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
          <BarChart data={mockAnalytics.registrationTrend}>
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