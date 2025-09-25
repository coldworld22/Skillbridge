// pages/admin/license-logs.js
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import { fetchLicenseLogs } from "@/services/admin/licenseService";

function LicenseLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLogs() {
      try {
        const data = await fetchLicenseLogs();
        if (!isMounted) return;
        setLogs(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load license logs", err);
        setLogs([]);
        setError("Unable to load license logs right now. Please try again later.");
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    }

    loadLogs();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🔒 License Monitoring</h1>

      <div className="bg-white shadow rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500" role="status">
            Loading license activity…
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600" role="alert">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No license activity recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm text-left">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">Domain</th>
                  <th className="px-4 py-2">IP Address</th>
                  <th className="px-4 py-2">Purchase Code</th>
                  <th className="px-4 py-2">Timestamp</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const status = log.status ?? "unknown";
                  const statusBadgeClass =
                    status === "success"
                      ? "bg-green-100 text-green-600"
                      : status === "domain_mismatch"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-600";

                  return (
                    <tr key={log.id} className="border-b last:border-b-0">
                      <td className="px-4 py-2 font-medium capitalize">
                        {log.action || "—"}
                      </td>
                      <td className="px-4 py-2">{log.domain || "—"}</td>
                      <td className="px-4 py-2">{log.ip || "—"}</td>
                      <td className="px-4 py-2">
                        {log.purchase_code || "—"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusBadgeClass}`}>
                          {status.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

LicenseLogsPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedLicenseLogsPage = withAuthProtection(LicenseLogsPage, [
  "admin",
  "superadmin",
]);

ProtectedLicenseLogsPage.getLayout = LicenseLogsPage.getLayout;

export default ProtectedLicenseLogsPage;
