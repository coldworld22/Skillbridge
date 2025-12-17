// pages/admin/license-logs.js
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { fetchLicenseLogs } from "@/services/admin/licenseService";
import styles from "./admin.module.scss";

function LicenseLogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLicenseLogs().then(setLogs).catch(() => setLogs([]));
  }, []);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>🔒 License Monitoring</h1>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>Domain</th>
              <th className={styles.th}>IP Address</th>
              <th className={styles.th}>Purchase Code</th>
              <th className={styles.th}>Timestamp</th>
              <th className={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className={`${styles.td} ${styles.emptyCell}`}>
                  No logs found.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className={styles.row}>
                <td className={styles.td} style={{ fontWeight: 700 }}>{log.domain}</td>
                <td className={styles.td}>{log.ip}</td>
                <td className={styles.td}>{log.purchase_code}</td>
                <td className={styles.td}>
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className={styles.td}>
                  <span className={`${styles.badge} ${log.status === 'success' ? styles.badgeSuccess : styles.badgeError}`}>
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
