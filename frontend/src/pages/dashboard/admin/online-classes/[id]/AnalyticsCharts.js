import React from "react";
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

export default function AnalyticsCharts({ t, locations, devices, registrationTrend }) {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            🌍 {t("classAnalyticsPage.top_countries")}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={locations} dataKey="value" nameKey="name" outerRadius={100}>
                {(locations ?? []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            📱 {t("classAnalyticsPage.devices_used")}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={devices} dataKey="value" nameKey="name" outerRadius={100}>
                {(devices ?? []).map((entry, index) => (
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
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          📈 {t("classAnalyticsPage.registration_trend")}
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={registrationTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="students" fill="#facc15" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
