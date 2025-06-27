import PageHead from "@/components/common/PageHead";
import AdminLayout from "@/components/layouts/AdminLayout";
import Link from "next/link";

const mockTickets = [
    {
        id: "TCK-1001",
        subject: "Refund not processed",
        user: "ayman@example.com",
        category: "Billing",
        status: "Open",
        createdAt: "2025-05-01",
        priority: "High",
    },
    {
        id: "TCK-1002",
        subject: "Unable to join live class",
        user: "student@domain.com",
        category: "Technical",
        status: "Resolved",
        createdAt: "2025-04-28",
        priority: "Medium",
    },
];

export default function AdminSupportTicketsPage() {
    return (
        <AdminLayout>
            <PageHead title="Support Tickets - Admin" />
            <div className="px-6 py-10">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">All Support Tickets</h1>

                <div className="overflow-x-auto border border-gray-200 rounded shadow-sm">
                    <table className="min-w-full table-auto bg-white">
                        <thead className="bg-gray-100 text-sm text-gray-600 uppercase">
                            <tr>
                                <th className="text-left px-4 py-3">Ticket ID</th>
                                <th className="text-left px-4 py-3">User</th>
                                <th className="text-left px-4 py-3">Subject</th>
                                <th className="text-left px-4 py-3">Category</th>
                                <th className="text-left px-4 py-3">Priority</th>
                                <th className="text-left px-4 py-3">Status</th>
                                <th className="text-left px-4 py-3">Created</th>
                                <th className="text-left px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockTickets.map((ticket) => (
                                <tr key={ticket.id} className="border-t border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-sm">{ticket.id}</td>
                                    <td className="px-4 py-3 text-sm">{ticket.user}</td>
                                    <td className="px-4 py-3 text-sm">{ticket.subject}</td>
                                    <td className="px-4 py-3 text-sm">{ticket.category}</td>
                                    <td className="px-4 py-3 text-sm">{ticket.priority}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${ticket.status === "Resolved"
                                                ? "bg-green-100 text-green-700"
                                                : ticket.status === "Open"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-gray-100 text-gray-600"
                                            }`}>
                                            {ticket.status}
                                        </span>

                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{ticket.createdAt}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <Link
                                            href={`/support/tickets/${ticket.id}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
