import { useEffect, useState } from "react";
import PageHead from "@/components/common/PageHead";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { fetchMyTickets } from "@/services/supportService";

export default function TicketStatusPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetchMyTickets()
      .then((data) => {
        if (isMounted) setTickets(data);
      })
      .catch(() => isMounted && setError("Failed to load tickets"))
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <PageHead title="My Support Tickets" />
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-20">
        <h1 className="text-3xl font-bold text-yellow-500 mb-8 text-center">
          My Support Tickets
        </h1>

        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : tickets.length === 0 ? (
          <p className="text-center text-gray-400">No support tickets found.</p>
        ) : (
          <div className="overflow-x-auto border border-gray-700 rounded shadow-lg">
            <table className="min-w-full table-auto bg-gray-800">
              <thead className="bg-gray-700 text-sm text-gray-300 uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Ticket ID</th>
                  <th className="text-left px-4 py-3">Subject</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Created</th>
                  <th className="text-left px-4 py-3">Last Updated</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-t border-gray-700 hover:bg-gray-700 transition"
                  >
                    <td className="px-4 py-3 font-mono">{ticket.id}</td>
                    <td className="px-4 py-3">{ticket.subject}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-sm font-semibold ${
                          ticket.status === "resolved"
                            ? "bg-green-600 text-white"
                            : ticket.status === "open"
                            ? "bg-yellow-500 text-black"
                            : "bg-gray-600 text-white"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{ticket.createdAt}</td>
                    <td className="px-4 py-3 text-gray-400">{ticket.lastUpdated}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`/support/tickets/${ticket.id}`}
                        className="text-blue-400 hover:underline text-sm"
                      >
                        View Details
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
