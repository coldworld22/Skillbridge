// components/admin/charts/InstructorActivityChart.js
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import styles from './Charts.module.scss';

export default function InstructorActivityChart({ data = [] }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>👨‍🏫 Instructor Tutorial Count</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="instructor" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="tutorials" fill="#a78bfa" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
