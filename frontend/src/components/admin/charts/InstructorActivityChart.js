// components/admin/charts/InstructorActivityChart.js
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const data = [
  { instructor: 'John', tutorials: 8 },
  { instructor: 'Sarah', tutorials: 6 },
  { instructor: 'Ali', tutorials: 10 },
  { instructor: 'Mina', tutorials: 4 },
];

export default function InstructorActivityChart() {
  return (
    <div className="bg-white p-6 rounded-xl shadow mt-8">
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
