// pages/admin/alerts.js
import { useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import useErrorLogStore from "@/store/errorLogs/errorLogStore";
import formatRelativeTime from "@/utils/relativeTime";

function AdminAlertsPage() {
  const logs = useErrorLogStore((state) => state.logs);
  const fetchLogs = useErrorLogStore((state) => state.fetch);
  const startPolling = useErrorLogStore((state) => state.startPolling);
  const stopPolling = useErrorLogStore((state) => state.stopPolling);

  useEffect(() => {
    fetchLogs();
    startPolling();
    return () => stopPolling();
  }, [fetchLogs, startPolling, stopPolling]);

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
            {logs.map((log) => (
              <tr key={log.id} className="border-b">
                <td className="px-4 py-2 font-medium">{log.type}</td>
                <td className="px-4 py-2 text-gray-700">{log.message}</td>
                <td className="px-4 py-2">
                  {formatRelativeTime(log.time)}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      log.level === 'ERROR'
                        ? 'bg-red-100 text-red-600'
                        : log.level === 'WARN'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {log.level}
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