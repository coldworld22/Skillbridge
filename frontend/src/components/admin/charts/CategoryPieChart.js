// components/admin/charts/CategoryPieChart.js
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Development', value: 500 },
  { name: 'Design', value: 200 },
  { name: 'Marketing', value: 150 },
  { name: 'Business', value: 100 },
];

const COLORS = ['#facc15', '#60a5fa', '#f87171', '#34d399'];

export default function CategoryPieChart() {
  return (
    <div className="bg-white p-6 rounded-xl shadow mt-8">
      <h2 className="text-xl font-semibold mb-4">📚 Tutorials by Category</h2>
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
