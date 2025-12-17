// pages/admin/alerts.js
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import useErrorLogStore from "@/store/errorLogs/errorLogStore";
import formatRelativeTime from "@/utils/relativeTime";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../next-i18next.config.js";
import styles from "./admin.module.scss";

function AdminAlertsPage() {
  const { t, i18n } = useTranslation('dashboard');
  const logs = useErrorLogStore((state) => state.logs);
  const fetchLogs = useErrorLogStore((state) => state.fetch);
  const startPolling = useErrorLogStore((state) => state.startPolling);
  const stopPolling = useErrorLogStore((state) => state.stopPolling);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const pageCount = Math.ceil(logs.length / itemsPerPage) || 1;
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedLogs = logs.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    fetchLogs();
    startPolling();
    return () => stopPolling();
  }, [fetchLogs, startPolling, stopPolling]);

  return (
    <AdminLayout>
      <div dir={i18n.dir()} className={styles.page}>
        <Link
          href="/dashboard/admin"
          className={styles.backLink}
        >
          <FaArrowLeft /> {t('back')}
        </Link>
        <h1 className={styles.title}>🚨 {t('alertsPage.title')}</h1>

        <div className={styles.card}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>{t('alertsPage.type')}</th>
                <th className={styles.th}>{t('alertsPage.message')}</th>
                <th className={styles.th}>{t('alertsPage.time')}</th>
                <th className={styles.th}>{t('alertsPage.level')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className={`${styles.td} ${styles.emptyCell}`}>
                    {t('alertsPage.no_alerts')}
                  </td>
                </tr>
              )}
              {paginatedLogs.map((log) => {
                const level = (log.level || '').toUpperCase();
                const rowClass =
                  level === 'ERROR'
                    ? styles.rowError
                    : level === 'WARN'
                    ? styles.rowWarn
                    : '';
                const badgeClass =
                  level === 'ERROR'
                    ? styles.badgeError
                    : level === 'WARN'
                    ? styles.badgeWarn
                    : styles.badgeInfo;
                return (
                  <tr
                    key={log.id}
                    className={`${styles.row} ${rowClass}`}
                  >
                    <td className={styles.td} style={{ fontWeight: 700 }}>{log.type}</td>
                    <td className={styles.td} style={{ color: '#475569' }}>{log.message}</td>
                    <td className={styles.td}>{formatRelativeTime(log.time)}</td>
                    <td className={styles.td}>
                      <span className={`${styles.badge} ${badgeClass}`}>
                        {log.level}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {pageCount > 1 && (
            <div className={styles.pager}>
              <button
                className={styles.pagerButton}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                {t('alertsPage.prev')}
              </button>
              <span>
                {page} / {pageCount}
              </span>
              <button
                className={styles.pagerButton}
                onClick={() => setPage((p) => Math.min(p + 1, pageCount))}
                disabled={page === pageCount}
              >
                {t('alertsPage.next')}
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuthProtection(AdminAlertsPage, ["admin", "superadmin"]);

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
