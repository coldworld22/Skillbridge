// pages/payments/index.js
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { fetchMyPayments } from "@/services/student/paymentService";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMyPayments();
        setPayments(Array.isArray(data) ? data : []);
      } catch (_) {
        setError("Failed to load payments");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const item = (p.item_name || p.tutorial || "").toLowerCase();
    return item.includes(searchTerm.toLowerCase());
  });

  const totalPaid = filteredPayments
    .filter((p) => (p.status || "").toLowerCase() === "paid")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const exportToCSV = () => {
    const csvContent = [
      ["Item", "Amount", "Status", "Date"],
      ...filteredPayments.map((p) => [
        p.item_name || p.tutorial || "N/A",
        p.amount,
        p.status,
        p.date || p.created_at,
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "payments.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
            placeholder="Search by item"
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

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            No payment records found.
          </div>
        ) : (
          <div className="overflow-x-auto shadow-lg rounded-xl border border-gray-700">
            <table className="min-w-full table-auto bg-gray-800 rounded-xl">
              <thead className="bg-gray-700 text-sm uppercase text-gray-300">
                <tr>
                  <th className="text-left px-5 py-4">#</th>
                  <th className="text-left px-5 py-4">Item</th>
                  <th className="text-left px-5 py-4">Amount</th>
                  <th className="text-left px-5 py-4">Status</th>
                  <th className="text-left px-5 py-4">Date</th>
                  <th className="text-left px-5 py-4">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.map((payment, index) => (
                  <tr
                    key={payment.id}
                    className="border-t border-gray-700 hover:bg-gray-700 transition"
                  >
                    <td className="px-5 py-4">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                    <td className="px-5 py-4 font-medium">{payment.item_name || payment.tutorial || 'N/A'}</td>
                    <td className="px-5 py-4 text-green-400 font-semibold">${payment.amount}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          (payment.status || '').toLowerCase() === "paid"
                            ? "bg-green-600 text-white"
                            : "bg-yellow-400 text-black"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400">{payment.date || payment.created_at}</td>
                    <td className="px-5 py-4">
                      <Link href={`/payments/invoice/${payment.id}`} className="text-yellow-400 underline">
                        View
                      </Link>
                    </td>
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

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
