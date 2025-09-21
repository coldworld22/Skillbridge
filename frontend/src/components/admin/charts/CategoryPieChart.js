// components/admin/charts/CategoryPieChart.js
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "next-i18next";

const COLORS = ['#facc15', '#60a5fa', '#f87171', '#34d399'];

export default function CategoryPieChart({ data = [], title }) {
  const { t } = useTranslation("dashboard");
  const heading = title ?? t("adminDashboardHome.tutorialsByCategory");

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">📚 {heading}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} fill="#8884d8" label>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
