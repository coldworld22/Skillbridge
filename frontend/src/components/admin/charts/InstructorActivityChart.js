// components/admin/charts/InstructorActivityChart.js
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function InstructorActivityChart({ data = [] }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">👨‍🏫 Instructor Tutorial Count</h2>
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
