// pages/admin/license-logs.js
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import { fetchLicenseLogs } from "@/services/admin/licenseService";

const statusStyles = {
  success: "bg-green-100 text-green-600",
  domain_mismatch: "bg-red-100 text-red-600",
  failed: "bg-red-100 text-red-600",
  error: "bg-red-100 text-red-600",
};

function LicenseLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadLogs = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchLicenseLogs();
        if (isMounted) {
          setLogs(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err?.statusMessage || err?.message || "Failed to load license logs.";
          setError(message);
          setLogs([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLogs();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasLogs = useMemo(() => logs.length > 0, [logs]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🔒 License Monitoring</h1>

      <div className="bg-white shadow rounded-xl overflow-x-auto">
        {error ? (
          <div className="p-4 text-sm text-red-600" role="alert">
            {error}
          </div>
        ) : null}
        {loading && !error ? (
          <div className="p-4 text-sm text-gray-600">Loading license logs…</div>
        ) : null}
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
            {!loading && !hasLogs ? (
              <tr>
                <td
                  className="px-4 py-4 text-center text-gray-500"
                  colSpan={5}
                >
                  No license data
                </td>
              </tr>
            ) : null}
            {logs.map((log) => {
              const badgeClass = statusStyles[log.status] || "bg-gray-100 text-gray-600";
              const timestamp = log.timestamp
                ? new Date(log.timestamp)
                : null;
              const timestampText = timestamp && !Number.isNaN(timestamp.getTime())
                ? timestamp.toLocaleString()
                : "—";

              return (
                <tr key={log.id} className="border-b">
                  <td className="px-4 py-2 font-medium">{log.domain || "—"}</td>
                  <td className="px-4 py-2">{log.ip || "—"}</td>
                  <td className="px-4 py-2">{log.purchase_code || "—"}</td>
                  <td className="px-4 py-2">{timestampText}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${badgeClass}`}>
                      {log.status || "unknown"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
