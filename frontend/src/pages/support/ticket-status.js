import Head from "next/head";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";

// Mocked ticket data (to be replaced with actual API integration)
const mockTickets = [
  {
    id: "TCK-1001",
    subject: "Refund not processed",
    status: "Open",
    createdAt: "2025-05-01",
    lastUpdated: "2025-05-03",
  },
  {
    id: "TCK-1002",
    subject: "Unable to join live class",
    status: "Resolved",
    createdAt: "2025-04-28",
    lastUpdated: "2025-04-30",
  },
];

export default function TicketStatusPage() {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Head>
        <title>My Support Tickets - SkillBridge</title>
      </Head>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-20">
        <h1 className="text-3xl font-bold text-yellow-500 mb-8 text-center">My Support Tickets</h1>

        {mockTickets.length === 0 ? (
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
                {mockTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-gray-700 hover:bg-gray-700 transition">
                    <td className="px-4 py-3 font-mono">{ticket.id}</td>
                    <td className="px-4 py-3">{ticket.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-sm font-semibold ${ticket.status === "Resolved"
                          ? "bg-green-600 text-white"
                          : ticket.status === "Open"
                            ? "bg-yellow-500 text-black"
                            : "bg-gray-600 text-white"
                        }`}>
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
