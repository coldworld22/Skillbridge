// components/admin/charts/SignupsChart.js
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import styles from './Charts.module.scss';

export default function SignupsChart({ data = [] }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>👥 Monthly Signups</h2>
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
