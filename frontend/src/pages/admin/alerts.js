// pages/admin/alerts.js
import AdminLayout from "@/components/layouts/AdminLayout";

const alerts = [
  {
    id: 1,
    type: "License Violation",
    message: "Unauthorized domain attempted to use the platform.",
    time: "2025-04-14 08:15",
    level: "Critical"
  },
  {
    id: 2,
    type: "Chat Flag",
    message: "User 'guest123' used inappropriate language in class.",
    time: "2025-04-14 10:42",
    level: "Warning"
  },
  {
    id: 3,
    type: "System Notice",
    message: "API key for payment gateway expiring soon.",
    time: "2025-04-14 09:00",
    level: "Info"
  }
];

function AdminAlertsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🚨 Real-Time Alerts</h1>

      <div className="bg-white shadow rounded-xl overflow-x-auto">
        <table className="w-full table-auto text-sm text-left">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Message</th>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">Level</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id} className="border-b">
                <td className="px-4 py-2 font-medium">{alert.type}</td>
                <td className="px-4 py-2 text-gray-700">{alert.message}</td>
                <td className="px-4 py-2">{alert.time}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    alert.level === 'Critical' ? 'bg-red-100 text-red-600' :
                    alert.level === 'Warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {alert.level}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

AdminAlertsPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default AdminAlertsPage;