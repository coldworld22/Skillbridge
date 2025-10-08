import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import { FiSearch, FiFilter, FiRefreshCw, FiPlus, FiCalendar, FiUser } from "react-icons/fi";

import PageHead from "@/components/common/PageHead";
import AdminLayout from "@/components/layouts/AdminLayout";
import TicketCard from "@/components/support/TicketCard";
import { fetchAllTickets } from "@/services/supportService";

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation("dashboard");
  const router = useRouter();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllTickets({
        status: status || undefined,
        priority: priority || undefined,
        search: search || undefined,
        ticketNumber: ticketNumber || undefined,
        dateRange: dateRange || undefined,
      });
      setTickets(data);
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetFilters = () => {
    setStatus("");
    setPriority("");
    setSearch("");
    setTicketNumber("");
    setDateRange("");
    load();
  };

  return (
    <AdminLayout>
      <PageHead title={t("support_center")} />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-7">
              {t("support_center")}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {t("manage_all_support_tickets")}
            </p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <FiPlus className="mr-2" />
            {t("new_ticket")}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-xs p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("status")}
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">{t("all_statuses")}</option>
                  <option value="open">{t("open")}</option>
                  <option value="pending">{t("pending")}</option>
                  <option value="resolved">{t("resolved")}</option>
                  <option value="closed">{t("closed")}</option>
                </select>
                <FiFilter className="absolute right-3 top-2.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("priority")}
              </label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">{t("all_priorities")}</option>
                  <option value="low">{t("low")}</option>
                  <option value="medium">{t("medium")}</option>
                  <option value="high">{t("high")}</option>
                  <option value="urgent">{t("urgent")}</option>
                </select>
                <FiFilter className="absolute right-3 top-2.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("date_range")}
              </label>
              <div className="relative">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">{t("all_time")}</option>
                  <option value="today">{t("today")}</option>
                  <option value="week">{t("this_week")}</option>
                  <option value="month">{t("this_month")}</option>
                  <option value="year">{t("this_year")}</option>
                </select>
                <FiCalendar className="absolute right-3 top-2.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("ticket_id")}
              </label>
              <input
                type="text"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && load()}
                className="block w-full border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="#"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("search")}
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                  placeholder={`${t("search")}...`}
                  onKeyPress={(e) => e.key === 'Enter' && load()}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4 space-x-3">
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiRefreshCw className="mr-2" />
              {t("reset")}
            </button>
            <button
              onClick={load}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t("loading")}...
                </>
              ) : (
                <>
                  <FiFilter className="mr-2" />
                  {t("apply_filters")}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {isLoading && tickets.length === 0 ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {t("no_tickets_found")}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t("try_changing_filters")}
              </p>
              <div className="mt-6">
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiRefreshCw className="mr-2" />
                  {t("reset_filters")}
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <li key={ticket.id}>
                  <TicketCard
                    ticket={ticket}
                    onClick={() =>
                      router.push(`/dashboard/admin/support/tickets/${ticket.id}`)
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pagination would go here */}
        {tickets.length > 0 && (
          <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white border-t border-gray-200 sm:px-6 rounded-b-lg">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  {t("showing")} <span className="font-medium">1</span> {t("to")}{" "}
                  <span className="font-medium">{tickets.length}</span> {t("of")}{" "}
                  <span className="font-medium">{tickets.length}</span> {t("results")}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <a
                    href="#"
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">{t("previous")}</span>
                    &larr;
                  </a>
                  <a
                    href="#"
                    aria-current="page"
                    className="z-10 bg-blue-50 border-blue-500 text-blue-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                  >
                    1
                  </a>
                  <a
                    href="#"
                    className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                  >
                    2
                  </a>
                  <a
                    href="#"
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">{t("next")}</span>
                    &rarr;
                  </a>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}