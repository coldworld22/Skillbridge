// components/admin/charts/SignupsChart.js
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { fetchMonthlySignups } from '@/services/admin/adminService';

export default function SignupsChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchMonthlySignups();
        setData(res || []);
      } catch (err) {
        console.error('Failed to load signups data', err);
      }
    };
    load();
  }, []);

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
