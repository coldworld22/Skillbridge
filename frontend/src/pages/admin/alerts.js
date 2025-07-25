// pages/admin/alerts.js
import { useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import useNotificationStore from "@/store/notifications/notificationStore";
import formatRelativeTime from "@/utils/relativeTime";

function AdminAlertsPage() {
  const alerts = useNotificationStore((state) => state.items);
  const fetchAlerts = useNotificationStore((state) => state.fetch);
  const startPolling = useNotificationStore((state) => state.startPolling);

  useEffect(() => {
    fetchAlerts();
    startPolling();
  }, [fetchAlerts, startPolling]);

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
                <td className="px-4 py-2">
                  {formatRelativeTime(alert.created_at || alert.time)}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      alert.level === 'Critical'
                        ? 'bg-red-100 text-red-600'
                        : alert.level === 'Warning'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {alert.level || 'Info'}
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

export default withAuthProtection(AdminAlertsPage, ["admin", "superadmin"]);