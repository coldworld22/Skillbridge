// pages/admin/license-logs.js
import AdminLayout from "@/components/layouts/AdminLayout";

const licenseLogs = [
  {
    id: 1,
    domain: "example.com",
    ip: "192.168.1.101",
    purchaseCode: "XYZ-123-ABC",
    status: "Verified",
    activatedAt: "2025-04-12 10:30"
  },
  {
    id: 2,
    domain: "piratecopy.net",
    ip: "10.20.30.40",
    purchaseCode: "Unknown",
    status: "Unauthorized",
    activatedAt: "2025-04-12 12:00"
  }
];

function LicenseLogsPage() {
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
              <th className="px-4 py-2">Activated At</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {licenseLogs.map((log) => (
              <tr key={log.id} className="border-b">
                <td className="px-4 py-2 font-medium">{log.domain}</td>
                <td className="px-4 py-2">{log.ip}</td>
                <td className="px-4 py-2">{log.purchaseCode}</td>
                <td className="px-4 py-2">{log.activatedAt}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${log.status === 'Verified' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
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
