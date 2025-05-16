import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { FaDollarSign, FaClock, FaWallet, FaArrowDown, FaFileExport } from "react-icons/fa";

const mockPayments = [
  { id: 1, title: "React Basics", amount: 120, date: "2025-04-10", status: "Paid", method: "PayPal" },
  { id: 2, title: "Next.js Bootcamp", amount: 200, date: "2025-04-20", status: "Pending", method: "Visa" },
  { id: 3, title: "Node.js Fundamentals", amount: 150, date: "2025-05-01", status: "Paid", method: "Apple Pay" },
];

export default function InstructorPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [isPushing, setIsPushing] = useState(false);
  const [methodFilter, setMethodFilter] = useState("all");

  useEffect(() => {
    setPayments(mockPayments);
  }, []);

  const totalEarnings = payments.reduce((sum, p) => sum + p.amount, 0);
  const currentBalance = payments.filter(p => p.status === "Pending").reduce((sum, p) => sum + p.amount, 0);
  const withdrawn = totalEarnings - currentBalance;

  const redirectToNewWithdrawal = () => {
    if (!isPushing) {
      setIsPushing(true);
      router.push("/dashboard/instructor/payments/withdrawals/new");
    }
  };

  const filteredPayments = methodFilter === "all" ? payments : payments.filter(p => p.method === methodFilter);

  const exportCSV = () => {
    const headers = ["Course", "Amount", "Date", "Status", "Method"];
    const rows = filteredPayments.map(({ title, amount, date, status, method }) => [title, amount, date, status, method]);
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "payments.csv";
    link.click();
  };

  return (
    <InstructorLayout>
      <div className="p-6 space-y-6 text-gray-800">
        <h1 className="text-2xl font-bold">💰 Instructor Payments</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 shadow rounded-xl flex items-center gap-4">
            <FaDollarSign className="text-2xl text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Total Earnings</p>
              <h2 className="text-xl font-semibold">${totalEarnings}</h2>
            </div>
          </div>
          <div className="bg-white p-4 shadow rounded-xl flex items-center gap-4">
            <FaClock className="text-2xl text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Pending Balance</p>
              <h2 className="text-xl font-semibold">${currentBalance}</h2>
            </div>
          </div>
          <div className="bg-white p-4 shadow rounded-xl flex items-center gap-4">
            <FaWallet className="text-2xl text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Total Withdrawn</p>
              <h2 className="text-xl font-semibold">${withdrawn}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow grid sm:grid-cols-3 gap-4">
          <Link href="/dashboard/instructor/payments/history" className="block bg-gray-50 hover:bg-gray-100 p-4 rounded shadow text-center">
            📜 Payment History
          </Link>
          <Link href="/dashboard/instructor/payments/withdrawals" className="block bg-gray-50 hover:bg-gray-100 p-4 rounded shadow text-center">
            🧾 Withdrawals
          </Link>
          <Link href="/dashboard/instructor/payments/settings" className="block bg-gray-50 hover:bg-gray-100 p-4 rounded shadow text-center">
            ⚙️ Payment Settings
          </Link>
          <Link href="/dashboard/instructor/payments/commissions" className="block bg-gray-50 hover:bg-gray-100 p-4 rounded shadow text-center">
            📉 Commission & Deductions
          </Link>
          <Link href="/dashboard/instructor/payments/classes" className="block bg-gray-50 hover:bg-gray-100 p-4 rounded shadow text-center">
            🎥 Online Class Earnings
          </Link>
          <Link href="/dashboard/instructor/payments/tutorials" className="block bg-gray-50 hover:bg-gray-100 p-4 rounded shadow text-center">
            📘 Tutorial Earnings
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Transaction History</h2>
            <div className="flex gap-2">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">All Methods</option>
                <option value="PayPal">PayPal</option>
                <option value="Visa">Visa</option>
                <option value="Apple Pay">Apple Pay</option>
              </select>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded"
              >
                <FaFileExport /> Export CSV
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded"
                onClick={redirectToNewWithdrawal}
              >
                <FaArrowDown /> Request Withdrawal
              </button>
            </div>
          </div>

          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Course</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Method</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{p.title}</td>
                  <td className="p-3">${p.amount}</td>
                  <td className="p-3">{p.date}</td>
                  <td className={`p-3 font-medium ${p.status === "Paid" ? "text-green-600" : "text-yellow-600"}`}>{p.status}</td>
                  <td className="p-3">{p.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </InstructorLayout>
  );
}