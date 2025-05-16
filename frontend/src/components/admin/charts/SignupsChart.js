// components/admin/charts/SignupsChart.js
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const data = [
  { month: 'Jan', users: 120 },
  { month: 'Feb', users: 180 },
  { month: 'Mar', users: 200 },
  { month: 'Apr', users: 230 },
  { month: 'May', users: 310 },
  { month: 'Jun', users: 400 },
];

export default function SignupsChart() {
  return (
    <div className="bg-white p-6 rounded-xl shadow mt-8">
      <h2 className="text-xl font-semibold mb-4">👥 Monthly Signups</h2>
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
