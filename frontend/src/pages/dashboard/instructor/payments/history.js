import { useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";

const mockHistory = [
  { id: 1, title: "React Basics", amount: 120, date: "2025-04-10", method: "Bank Transfer", status: "Paid" },
  { id: 2, title: "Next.js Bootcamp", amount: 200, date: "2025-04-20", method: "PayPal", status: "Pending" },
  { id: 3, title: "Node.js Fundamentals", amount: 150, date: "2025-05-01", method: "Bank Transfer", status: "Paid" },
  { id: 4, title: "AI with Python", amount: 180, date: "2025-05-03", method: "PayPal", status: "Paid" },
];

export default function InstructorPaymentsHistoryPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredHistory = mockHistory.filter((entry) => {
    const matchesStatus = statusFilter === "all" || entry.status.toLowerCase() === statusFilter;
    const entryDate = new Date(entry.date);
    const matchesStart = !startDate || entryDate >= new Date(startDate);
    const matchesEnd = !endDate || entryDate <= new Date(endDate);
    return matchesStatus && matchesStart && matchesEnd;
  });

  const exportCSV = () => {
    const headers = ["Class", "Amount", "Date", "Method", "Status"];
    const rows = filteredHistory.map(({ title, amount, date, method, status }) => [title, amount, date, method, status]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "payment_history.csv";
    link.click();
  };

  return (
    <InstructorLayout>
      <div className="p-6 space-y-6 text-gray-800">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">📜 Payment History</h1>
          <button
            onClick={exportCSV}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded font-medium"
          >
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium">Filter by Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Class</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Date</th>
                <th className="p-3">Method</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((entry) => (
                <tr key={entry.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{entry.title}</td>
                  <td className="p-3">${entry.amount}</td>
                  <td className="p-3">{entry.date}</td>
                  <td className="p-3">{entry.method}</td>
                  <td className={`p-3 font-medium ${entry.status === "Paid" ? "text-green-600" : "text-yellow-600"}`}>{entry.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </InstructorLayout>
  );
}