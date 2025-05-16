import React from "react";

export default function OverviewTab({ onViewAll }) {
  const summaryCards = [
    { label: "Total Revenue", value: "$12,500", icon: "💰" },
    { label: "Total Transactions", value: "340", icon: "🔁" },
    { label: "Active Payment Methods", value: "4", icon: "💳" },
    { label: "Pending Payouts", value: "$850", icon: "🕒" },
  ];

  const recentTransactions = [
    { user: "John Doe", method: "PayPal", amount: "$29.99", status: "Success" },
    { user: "Jane Smith", method: "Stripe", amount: "$49.99", status: "Failed" },
    { user: "Ali Hassan", method: "Crypto Wallet", amount: "$19.99", status: "Pending" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => (
          <div key={idx} className="bg-white shadow rounded p-4 flex items-center gap-4">
            <div className="text-3xl">{card.icon}</div>
            <div>
              <div className="text-sm text-gray-500">{card.label}</div>
              <div className="text-xl font-semibold">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-2">Revenue Over Time</h3>
          <img
            src="/mock-charts/revenue-chart.png"
            alt="Revenue Chart"
            className="w-full h-56 object-contain"
          />
        </div>
        <div className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-2">Transactions by Status</h3>
          <div className="flex justify-center items-center h-56 text-gray-400">
            (Donut Chart Placeholder)
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white shadow rounded">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <button
            onClick={onViewAll}
            className="text-indigo-600 hover:underline text-sm"
          >
            View All
          </button>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">Method</th>
              <th className="px-4 py-2 text-left">Amount</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.map((txn, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{txn.user}</td>
                <td className="px-4 py-2">{txn.method}</td>
                <td className="px-4 py-2 text-green-600 font-medium">{txn.amount}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      txn.status === "Success"
                        ? "bg-green-100 text-green-800"
                        : txn.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {txn.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
