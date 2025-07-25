// pages/admin/alerts.js
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import useErrorLogStore from "@/store/errorLogs/errorLogStore";
import formatRelativeTime from "@/utils/relativeTime";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../next-i18next.config.js";

function AdminAlertsPage() {
  const { t, i18n } = useTranslation('dashboard', { keyPrefix: 'alertsPage' });
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
    <div dir={i18n.dir()}>
      <h1 className="text-2xl font-bold mb-6">🚨 {t('title')}</h1>

      <div className="bg-white shadow rounded-xl overflow-x-auto">
        <table className="w-full table-auto text-sm text-left">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-2">{t('type')}</th>
              <th className="px-4 py-2">{t('message')}</th>
              <th className="px-4 py-2">{t('time')}</th>
              <th className="px-4 py-2">{t('level')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  {t('no_alerts')}
                </td>
              </tr>
            )}
            {paginatedLogs.map((log) => (
              <tr
                key={log.id}
                className={`border-b ${
                  log.level === 'ERROR'
                    ? 'bg-red-50'
                    : log.level === 'WARN'
                    ? 'bg-yellow-50'
                    : ''
                }`}
              >
                <td className="px-4 py-2 font-medium">{log.type}</td>
                <td className="px-4 py-2 text-gray-700">{log.message}</td>
                <td className="px-4 py-2">{formatRelativeTime(log.time)}</td>
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
        {pageCount > 1 && (
          <div className="flex justify-between items-center p-4 text-sm">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              {t('prev')}
            </button>
            <span>
              {page} / {pageCount}
            </span>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(p + 1, pageCount))}
              disabled={page === pageCount}
            >
              {t('next')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

AdminAlertsPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedAdminAlertsPage = withAuthProtection(AdminAlertsPage, [
  "admin",
  "superadmin",
]);

ProtectedAdminAlertsPage.getLayout = AdminAlertsPage.getLayout;

export default ProtectedAdminAlertsPage;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
