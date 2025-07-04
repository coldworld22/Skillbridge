// pages/dashboard/instructor/tutorials/[id]/analytics.js
import { useRouter } from "next/router";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useEffect, useState } from "react";
import { fetchInstructorTutorialAnalytics } from "@/services/instructor/tutorialService";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function TutorialAnalyticsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchInstructorTutorialAnalytics(id)
      .then((data) => setStats(data))
      .catch(() => setStats(null));
  }, [id]);

  if (!stats) {
    return (
      <InstructorLayout>
        <div className="p-6 text-center text-sm text-muted-foreground">Loading analytics...</div>
      </InstructorLayout>
    );
  }

  const completionRate =
    stats.totalStudents > 0 ? ((stats.completed / stats.totalStudents) * 100).toFixed(1) : "0";

  return (
    <InstructorLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">📊 Tutorial Analytics - {id}</h1>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow border">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">👥 Total Students</h2>
            <p className="text-3xl font-bold text-green-600">{stats.totalStudents}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">💰 Total Revenue</h2>
            <p className="text-3xl font-bold text-indigo-600">${stats.totalRevenue}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">🎯 Completion Rate</h2>
            <p className="text-3xl font-bold text-purple-600">{completionRate}%</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">📈 Enrollment Trend</h2>
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
    </InstructorLayout>
  );
}
