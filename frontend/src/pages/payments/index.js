// pages/payments/index.js
import { useEffect, useState } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";

const mockPayments = [
  {
    id: 1,
    tutorial: "Mastering React.js",
    user: "ayman@example.com",
    amount: 49,
    status: "Paid",
    date: "2025-04-05",
  },
  {
    id: 2,
    tutorial: "React Hooks Deep Dive",
    user: "john.doe@example.com",
    amount: 39,
    status: "Pending",
    date: "2025-04-04",
  },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setPayments(mockPayments);
  }, []);

  const filteredPayments = payments.filter(
    (p) =>
      p.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tutorial.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPaid = filteredPayments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const exportToCSV = () => {
    const csvContent = [
      ["Tutorial", "User", "Amount", "Status", "Date"],
      ...filteredPayments.map((p) => [
        p.tutorial,
        p.user,
        p.amount,
        p.status,
        p.date,
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "payments.csv";
    link.click();
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-20 mt-16">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
            💳 Payment Management
          </h1>
          <p className="text-gray-400">Track all course payments made by users</p>
        </div>

        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Search by user or tutorial"
            className="px-4 py-2 rounded bg-gray-800 text-white w-full md:w-1/3 border border-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={exportToCSV}
            className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-300 transition"
          >
            Export CSV
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-lg text-green-400 font-semibold">
            Total Revenue: ${totalPaid}
          </h2>
          <p className="text-sm text-gray-400">
            Transactions: {filteredPayments.length}
          </p>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            No payment records found.
          </div>
        ) : (
          <div className="overflow-x-auto shadow-lg rounded-xl border border-gray-700">
            <table className="min-w-full table-auto bg-gray-800 rounded-xl">
              <thead className="bg-gray-700 text-sm uppercase text-gray-300">
                <tr>
                  <th className="text-left px-5 py-4">#</th>
                  <th className="text-left px-5 py-4">Tutorial</th>
                  <th className="text-left px-5 py-4">User</th>
                  <th className="text-left px-5 py-4">Amount</th>
                  <th className="text-left px-5 py-4">Status</th>
                  <th className="text-left px-5 py-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.map((payment, index) => (
                  <tr
                    key={payment.id}
                    className="border-t border-gray-700 hover:bg-gray-700 transition"
                  >
                    <td className="px-5 py-4">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                    <td className="px-5 py-4 font-medium">{payment.tutorial}</td>
                    <td className="px-5 py-4">{payment.user}</td>
                    <td className="px-5 py-4 text-green-400 font-semibold">${payment.amount}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          payment.status === "Paid"
                            ? "bg-green-600 text-white"
                            : "bg-yellow-400 text-black"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400">{payment.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={`px-4 py-2 rounded ${
                  currentPage === i + 1
                    ? "bg-yellow-400 text-black"
                    : "bg-gray-700 text-white"
                }`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
