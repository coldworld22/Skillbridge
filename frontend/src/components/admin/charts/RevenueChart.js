// components/admin/charts/RevenueChart.js
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import styles from "./Charts.module.scss";

const formatCurrency = (value, currency) => {
  const numeric = Number(value);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: safeValue >= 1000 ? 0 : 2,
    maximumFractionDigits: safeValue >= 1000 ? 0 : 2,
  }).format(safeValue);
};

export default function RevenueChart({ data = [], currency = "USD" }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>📈 Monthly Revenue</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => formatCurrency(value, currency)} />
          <Tooltip formatter={(value, name) => [formatCurrency(value, currency), name]} />
          <Line type="monotone" dataKey="revenue" stroke="#facc15" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
