import Head from "next/head";
import Link from "next/link";
import StudentLayout from "@/components/layouts/StudentLayout";

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

export default function MyTicketsPage() {
  return (
    <StudentLayout>
      <Head>
        <title>My Tickets - Dashboard | SkillBridge</title>
      </Head>
      <div className="px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Support Tickets</h1>
          <Link
            href="/support/submit"
            className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600 transition"
          >
            + New Ticket
          </Link>
        </div>

        {mockTickets.length === 0 ? (
          <p className="text-gray-500 text-center">You haven’t submitted any tickets yet.</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded shadow-sm">
            <table className="min-w-full table-auto bg-white">
              <thead className="bg-gray-100 text-sm text-gray-600 uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Ticket ID</th>
                  <th className="text-left px-4 py-3">Subject</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Created</th>
                  <th className="text-left px-4 py-3">Last Updated</th>
                  <th className="text-left px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockTickets.map((ticket) => (
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
                    <td className="px-4 py-3 text-sm text-gray-500">{ticket.createdAt}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{ticket.lastUpdated}</td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/support/tickets/${ticket.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View Details
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
