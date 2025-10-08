// pages/admin/license-logs.js
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { fetchLicenseLogs } from "@/services/admin/licenseService";

function LicenseLogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLicenseLogs().then(setLogs).catch(() => setLogs([]));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🔒 License Monitoring</h1>

      <div className="bg-white shadow rounded-xl overflow-x-auto">
        <table className="w-full table-auto text-sm text-left">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-2">Domain</th>
              <th className="px-4 py-2">IP Address</th>
              <th className="px-4 py-2">Purchase Code</th>
              <th className="px-4 py-2">Timestamp</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b">
                <td className="px-4 py-2 font-medium">{log.domain}</td>
                <td className="px-4 py-2">{log.ip}</td>
                <td className="px-4 py-2">{log.purchase_code}</td>
                <td className="px-4 py-2">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${log.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {log.status}
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

LicenseLogsPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default LicenseLogsPage;
