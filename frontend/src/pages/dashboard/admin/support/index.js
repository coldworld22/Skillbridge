import PageHead from "@/components/common/PageHead";
import AdminLayout from "@/components/layouts/AdminLayout";
import Link from "next/link";
import { FiFilter, FiInbox, FiUsers, FiBarChart2, FiHelpCircle, FiSettings } from "react-icons/fi";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

export default function AdminSupportHome() {
  const { t } = useTranslation('dashboard');
  return (
    <AdminLayout>
      <PageHead title={t('support_dashboard')} />
      <div className="px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('support_dashboard')}</h1>
            <p className="text-gray-600 mt-2">{t('manage_support')}</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-3">
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
              <FiFilter className="absolute right-3 top-2.5 text-gray-400" />
            </div>
            
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>All Status</option>
                <option>Open</option>
                <option>Pending</option>
                <option>Resolved</option>
              </select>
              <FiFilter className="absolute right-3 top-2.5 text-gray-400" />
            </div>
          </div>
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
            href="/dashboard/admin/support/customers"
            className="group block border border-gray-200 bg-white hover:border-purple-500 rounded-xl p-6 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-purple-50 text-purple-600 mr-4">
                <FiUsers size={20} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600">{t('customer_management')}</h2>
            </div>
            <p className="text-gray-600 text-sm">View customer profiles and support history.</p>
            <div className="mt-4 text-sm text-purple-600 font-medium flex items-center">
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

          <Link
            href="/dashboard/admin/support/knowledge"
            className="group block border border-gray-200 bg-white hover:border-yellow-500 rounded-xl p-6 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600 mr-4">
                <FiHelpCircle size={20} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-yellow-600">{t('knowledge_base')}</h2>
            </div>
            <p className="text-gray-600 text-sm">Manage help articles and documentation.</p>
            <div className="mt-4 text-sm text-yellow-600 font-medium flex items-center">
              {t('manage_content')}
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
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="px-6 py-4 flex items-start hover:bg-gray-50 transition">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">New ticket #123{item} created</p>
                  <p className="text-sm text-gray-500">Customer reported issue with login</p>
                  <p className="text-xs text-gray-400 mt-1">2{item} minutes ago</p>
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