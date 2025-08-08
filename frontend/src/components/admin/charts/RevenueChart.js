// components/admin/charts/RevenueChart.js
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { fetchMonthlyRevenue } from '@/services/admin/adminService';

export default function RevenueChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchMonthlyRevenue();
        setData(res || []);
      } catch (err) {
        console.error('Failed to load revenue data', err);
      }
    };
    load();
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-8">
      <h2 className="text-xl font-semibold mb-4">📈 Monthly Revenue</h2>
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
