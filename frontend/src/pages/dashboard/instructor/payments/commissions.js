import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useState } from "react";
import { FaInfoCircle, FaFileDownload } from "react-icons/fa";

const mockSummary = {
  commissionRate: 20,
  totalEarnings: 1200,
  platformCut: 240,
  netEarnings: 960,
  deductions: [
    { id: 1, label: "Transaction Fees", amount: 18 },
    { id: 2, label: "Tax Deduction", amount: 22 },
  ],
  breakdown: [
    { id: 1, title: "React Basics", amount: 400, commission: 80 },
    { id: 2, title: "Node.js Course", amount: 300, commission: 60 },
    { id: 3, title: "AI Tutorial", amount: 500, commission: 100 },
  ]
};

export default function InstructorCommissionPage() {
  const [filter, setFilter] = useState("all");

  const totalDeductions = mockSummary.deductions.reduce((sum, d) => sum + d.amount, 0);
  const finalPayout = mockSummary.netEarnings - totalDeductions;

  const exportCSV = () => {
    const headers = ["Title", "Amount", "Commission"];
    const rows = mockSummary.breakdown.map((item) => [item.title, item.amount, item.commission]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "class_commission_breakdown.csv";
    link.click();
  };

  return (
    <InstructorLayout>
      <div className="p-6 max-w-3xl mx-auto text-gray-800">
        <h1 className="text-2xl font-bold mb-6">📉 Platform Commission & Deductions</h1>

        <div className="bg-white p-6 rounded-xl shadow space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-lg font-medium">
                Platform Commission Rate: <span className="text-yellow-600 font-bold">{mockSummary.commissionRate}%</span>
              </p>
              <p className="mt-2">Total Earnings Before Deductions: <span className="font-semibold">${mockSummary.totalEarnings}</span></p>
              <p>Commission Deducted: <span className="text-red-600">-${mockSummary.platformCut}</span></p>
              <p className="text-green-600">Net Earnings After Commission: ${mockSummary.netEarnings}</p>
            </div>
            <div className="text-gray-400 text-sm flex items-center gap-2">
              <FaInfoCircle className="text-yellow-500" />
              Platform commission is fixed at 20%. Transaction and tax fees may vary depending on your payout method and location.
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Class-by-Class Commission Breakdown</h2>
            <table className="w-full table-auto border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Title</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2 text-left">Commission</th>
                </tr>
              </thead>
              <tbody>
                {mockSummary.breakdown.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">{item.title}</td>
                    <td className="p-2">${item.amount}</td>
                    <td className="p-2 text-red-500">-${item.commission}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={exportCSV}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded"
            >
              <FaFileDownload /> Export CSV
            </button>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Additional Deductions</h2>
            <ul className="space-y-2">
              {mockSummary.deductions.map((item) => (
                <li key={item.id} className="flex justify-between border-b pb-2">
                  <span>{item.label}</span>
                  <span className="text-red-500">-${item.amount}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t">
            <p className="font-medium text-lg">
              💵 Final Payout After All Deductions: <span className="text-green-700 font-bold">${finalPayout}</span>
            </p>
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
}
