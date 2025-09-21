// components/admin/charts/SignupsChart.js
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useTranslation } from "next-i18next";

export default function SignupsChart({ data = [], title }) {
  const { t } = useTranslation("dashboard");
  const heading = title ?? t("adminDashboardHome.monthlySignups");

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">👥 {heading}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="users" fill="#60a5fa" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
