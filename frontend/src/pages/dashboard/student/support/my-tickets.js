import PageHead from "@/components/common/PageHead";
import Link from "next/link";
import StudentLayout from "@/components/layouts/StudentLayout";
import { useEffect, useState } from "react";
import { fetchMyTickets } from "@/services/supportService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../next-i18next.config.js";

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const { t } = useTranslation('dashboard');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await fetchMyTickets();
      setTickets(data);
    } catch (err) {
      console.error("Failed to load tickets", err);
    }
  };

  return (
    <StudentLayout>
      <PageHead title={t('my_tickets')} />
      <div className="px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('my_tickets')}</h1>
          <Link
            href="/support/submit"
            className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600 transition"
          >
            {t('new_ticket')}
          </Link>
        </div>

        {tickets.length === 0 ? (
          <p className="text-gray-500 text-center">{t('no_tickets')}</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded shadow-sm">
            <table className="min-w-full table-auto bg-white">
              <thead className="bg-gray-100 text-sm text-gray-600 uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Ticket ID</th>
                  <th className="text-left px-4 py-3">Subject</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Created</th>
                  <th className="text-left px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{ticket.id}</td>
                    <td className="px-4 py-3 text-sm">{ticket.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        ticket.status === "Resolved"
                          ? "bg-green-100 text-green-700"
                          : ticket.status === "Open"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-200 text-gray-600"
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/support/tickets/${ticket.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {t('view_details')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}

