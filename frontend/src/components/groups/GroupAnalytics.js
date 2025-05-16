import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';

export default function GroupAnalytics({ groupId }) {
  const [stats, setStats] = useState({
    activeMembers: 0,
    totalMessages: 0,
    dailyActivity: [],
    messageTypes: [],
  });

  const [selectedRoles, setSelectedRoles] = useState(['admin', 'moderator', 'member']);

  useEffect(() => {
    // Mock data
    setStats({
      activeMembers: 3,
      totalMessages: 56,
      dailyActivity: [
        { date: '2025-05-01', admin: 4, moderator: 3, member: 3 },
        { date: '2025-05-02', admin: 2, moderator: 6, member: 12 },
        { date: '2025-05-03', admin: 5, moderator: 4, member: 17 },
        { date: '2025-05-04', admin: 1, moderator: 2, member: 11 },
      ],
      messageTypes: [
        { type: 'Text', count: 70 },
        { type: 'Image', count: 15 },
        { type: 'Audio', count: 9 },
        { type: 'Video', count: 6 },
      ],
    });
  }, [groupId]);

  const toggleRole = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="mt-6 bg-white p-6 rounded-lg shadow border max-w-4xl mx-auto">
      <h3 className="text-xl font-bold mb-4">📊 Group Analytics</h3>

      {/* Summary */}
      <div className="mb-4">
        <p><strong>Active Members:</strong> {stats.activeMembers}</p>
        <p><strong>Total Messages:</strong> {stats.totalMessages}</p>
      </div>

      {/* Role Filter */}
      <div className="mb-4 space-x-4">
        <strong>Filter by Role:</strong>
        {['admin', 'moderator', 'member'].map((role) => (
          <label key={role} className="text-sm mr-2 capitalize">
            <input
              type="checkbox"
              checked={selectedRoles.includes(role)}
              onChange={() => toggleRole(role)}
              className="mr-1"
            />
            {role}
          </label>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.dailyActivity}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            {selectedRoles.includes('admin') && <Bar dataKey="admin" stackId="a" fill="#6366f1" />}
            {selectedRoles.includes('moderator') && <Bar dataKey="moderator" stackId="a" fill="#10b981" />}
            {selectedRoles.includes('member') && <Bar dataKey="member" stackId="a" fill="#f59e0b" />}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div className="mt-10">
        <h4 className="font-semibold mb-2 text-md">Message Type Breakdown</h4>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={stats.messageTypes}
              dataKey="count"
              nameKey="type"
              outerRadius={80}
              label
            >
              {stats.messageTypes.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
