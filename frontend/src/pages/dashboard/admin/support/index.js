import PageHead from "@/components/common/PageHead";
import AdminLayout from "@/components/layouts/AdminLayout";
import Link from "next/link";
import { FiInbox, FiBarChart2 } from "react-icons/fi";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import { fetchRecentActivity } from "@/services/supportService";
import formatRelativeTime from "@/utils/relativeTime";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

export default function AdminSupportHome() {
  const { t } = useTranslation('dashboard');
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      const data = await fetchRecentActivity();
      setActivity(data);
    } catch (err) {
      console.error('Failed to load activity', err);
    }
  };
  return (
    <AdminLayout>
      <PageHead title={t('support_dashboard')} />
      <div className="px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('support_dashboard')}</h1>
            <p className="text-gray-600 mt-2">{t('manage_support')}</p>
          </div>
          
          <div></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <Link
            href="/dashboard/admin/support/tickets"
            className="group block border border-gray-200 bg-white hover:border-blue-500 rounded-xl p-6 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600 mr-4">
                <FiInbox size={20} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">{t('manage_tickets')}</h2>
            </div>
            <p className="text-gray-600 text-sm">View, filter, and respond to all support requests.</p>
            <div className="mt-4 text-sm text-blue-600 font-medium flex items-center">
              {t('view_all')}
              <svg className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>


          <Link
            href="/dashboard/admin/support/analytics"
            className="group block border border-gray-200 bg-white hover:border-green-500 rounded-xl p-6 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-green-50 text-green-600 mr-4">
                <FiBarChart2 size={20} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">{t('support_analytics')}</h2>
            </div>
            <p className="text-gray-600 text-sm">View metrics and reports on support performance.</p>
            <div className="mt-4 text-sm text-green-600 font-medium flex items-center">
              {t('view_reports')}
              <svg className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

        </div>

        {/* Recent Activity Section */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{t('recent_activity')}</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {activity.map((item) => (
              <div key={item.id} className="px-6 py-4 flex items-start hover:bg-gray-50 transition">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">New ticket #{item.id} created</p>
                  <p className="text-sm text-gray-500">{item.subject}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(item.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 bg-gray-50 text-right">
            <Link href="/dashboard/admin/support/tickets" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              {t('view_all')} →
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
