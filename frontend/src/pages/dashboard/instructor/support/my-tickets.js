import PageHead from "@/components/common/PageHead";
import Link from "next/link";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useEffect, useState } from "react";
import { fetchMyTickets, deleteTicket } from "@/services/supportService";
import StatusBadge from "@/components/support/StatusBadge";
import { FaEye, FaTrashAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [numberFilter, setNumberFilter] = useState("");
  const { t } = useTranslation('dashboard');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await fetchMyTickets();
      setTickets(data);
      toast.success(t("tickets_loaded"));
    } catch (err) {
      toast.error(t("tickets_load_failed"));
      console.error("Failed to load tickets", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('confirm_delete_ticket'))) return;
    try {
      await deleteTicket(id);
      setTickets(tickets.filter((t) => t.id !== id));
      toast.success(t('ticket_deleted'));
    } catch (err) {
      console.error('Failed to delete ticket', err);
      toast.error(t('delete_failed'));
    }
  };

  const filteredTickets = tickets.filter(
    (ticket) =>
      (statusFilter === "All" || ticket.status === statusFilter) &&
      (numberFilter === "" ||
        ticket.ticket_number?.toString().includes(numberFilter))
  );

  return (
    <InstructorLayout>
      <PageHead title={t('my_tickets')} />
      <div className="px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('my_tickets')}</h1>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={numberFilter}
              onChange={(e) => setNumberFilter(e.target.value)}
              placeholder="Ticket #"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="All">{t('all_statuses')}</option>
              <option value="Open">Open</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <Link
              href="/support/submit"
              className="bg-yellow-500 text-black text-sm px-4 py-2 rounded hover:bg-yellow-600 transition font-semibold"
            >
              {t('new_ticket')}
            </Link>
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <p className="text-center text-gray-500">{t('no_tickets')}</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            <table className="min-w-full bg-white table-auto">
              <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
                <tr>
                  <th className="text-left px-4 py-3">{t('ticket_id')}</th>
                  <th className="text-left px-4 py-3">{t('subject')}</th>
                  <th className="text-left px-4 py-3">{t('status')}</th>
                  <th className="text-left px-4 py-3">{t('created')}</th>
                  <th className="text-left px-4 py-3">{t('action')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-mono text-sm text-gray-700">{ticket.ticket_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{ticket.subject}</td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/support/tickets/${ticket.id}`}
                        className="bg-blue-500 text-white px-3 py-1 rounded inline-flex items-center gap-1 hover:bg-blue-600"
                      >
                        <FaEye /> {t('view_details')}
                      </Link>
                      {(['Resolved', 'Closed'].includes(ticket.status)) && (
                        <button
                          onClick={() => handleDelete(ticket.id)}
                          className="text-red-600 hover:underline ml-2 inline-flex items-center gap-1"
                        >
                          <FaTrashAlt /> {t('delete_ticket')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
