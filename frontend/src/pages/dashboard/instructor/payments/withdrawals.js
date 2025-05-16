import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useState } from "react";

const mockWithdrawals = [
  { id: 1, amount: 150, method: "Bank Transfer", date: "2025-04-25", status: "Approved" },
  { id: 2, amount: 200, method: "PayPal", date: "2025-05-01", status: "Pending" },
  { id: 3, amount: 100, method: "Visa", date: "2025-05-03", status: "Rejected" },
  { id: 4, amount: 180, method: "Apple Pay", date: "2025-05-04", status: "Approved" },
];

export default function InstructorWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState(mockWithdrawals);

  const cancelRequest = (id) => {
    const confirmCancel = confirm("Are you sure you want to cancel this request?");
    if (confirmCancel) {
      setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status: "Cancelled" } : w));
    }
  };

  const exportCSV = () => {
    const headers = ["Amount", "Method", "Date", "Status"];
    const rows = withdrawals.map(({ amount, method, date, status }) => [amount, method, date, status]);
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "withdrawals.csv";
    link.click();
  };

  return (
    <InstructorLayout>
      <div className="p-6 space-y-6 text-gray-800">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">💸 Withdrawal Requests</h1>
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded shadow"
          >
            Export CSV
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Amount</th>
                <th className="p-3">Method</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">${w.amount}</td>
                  <td className="p-3">{w.method}</td>
                  <td className="p-3">{w.date}</td>
                  <td className={`p-3 font-medium ${w.status === "Approved" ? "text-green-600" : w.status === "Rejected" ? "text-red-500" : w.status === "Cancelled" ? "text-gray-500" : "text-yellow-600"}`}>{w.status}</td>
                  <td className="p-3">
                    {w.status === "Pending" && (
                      <button
                        onClick={() => cancelRequest(w.id)}
                        className="text-red-600 hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </InstructorLayout>
  );
}