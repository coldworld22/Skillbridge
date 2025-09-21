// components/admin/charts/RevenueChart.js
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useTranslation } from "next-i18next";

export default function RevenueChart({ data = [], title }) {
  const { t } = useTranslation("dashboard");
  const heading = title ?? t("adminDashboardHome.monthlyRevenue");

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">📈 {heading}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `$${value}`} />
          <Tooltip formatter={(value) => `$${value}`} />
          <Line type="monotone" dataKey="revenue" stroke="#facc15" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
