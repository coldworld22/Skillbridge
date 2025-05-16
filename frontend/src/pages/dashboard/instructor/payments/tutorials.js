import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useState } from "react";
import { FaInfoCircle, FaDownload, FaFilePdf } from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const mockTutorialEarnings = [
  { id: 1, title: "Intro to Python", students: 40, price: 15, total: 600, commission: 120, date: "2025-05-01" },
  { id: 2, title: "Advanced CSS", students: 30, price: 20, total: 600, commission: 120, date: "2025-05-02" },
];

export default function InstructorTutorialEarningsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredEarnings = mockTutorialEarnings.filter((tut) => {
    const date = new Date(tut.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    return (!start || date >= start) && (!end || date <= end);
  });

  const exportCSV = () => {
    const headers = ["Title", "Students", "Price", "Total Earned", "Commission Deducted", "Net Earnings"];
    const rows = filteredEarnings.map(({ title, students, price, total, commission }) => [
      title,
      students,
      `$${price}`,
      `$${total}`,
      `$${commission}`,
      `$${total - commission}`
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "tutorial_earnings.csv";
    link.click();
  };

  const downloadPDF = () => {
    alert("📄 PDF tax statement downloaded (mocked). Add actual PDF logic here.");
  };

  const chartData = {
    labels: filteredEarnings.map((tut) => tut.title),
    datasets: [
      {
        label: "Commission ($)",
        data: filteredEarnings.map((tut) => tut.commission),
        backgroundColor: "#fbbf24",
      },
      {
        label: "Net Earnings ($)",
        data: filteredEarnings.map((tut) => tut.total - tut.commission),
        backgroundColor: "#34d399",
      },
    ],
  };

  const totalCommission = filteredEarnings.reduce((sum, tut) => sum + tut.commission, 0);
  const totalNet = filteredEarnings.reduce((sum, tut) => sum + (tut.total - tut.commission), 0);
  const commissionPercent = ((totalCommission / (totalCommission + totalNet)) * 100).toFixed(1);
  const netPercent = (100 - commissionPercent).toFixed(1);

  return (
    <InstructorLayout>
      <div className="p-6 text-gray-800 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎓 Tutorial Earnings</h1>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black font-medium rounded hover:bg-yellow-600"
            >
              <FaDownload /> Export CSV
            </button>
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600"
            >
              <FaFilePdf /> Download Tax PDF
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-2 rounded" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Title</th>
                <th className="p-3">Students</th>
                <th className="p-3">Price</th>
                <th className="p-3">Total Earned</th>
                <th className="p-3">Commission</th>
                <th className="p-3">Net Earnings</th>
              </tr>
            </thead>
            <tbody>
              {filteredEarnings.map((tut) => (
                <tr key={tut.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{tut.title}</td>
                  <td className="p-3">{tut.students}</td>
                  <td className="p-3">${tut.price}</td>
                  <td className="p-3 text-green-600 font-semibold">${tut.total}</td>
                  <td className="p-3 text-red-500 font-medium">-${tut.commission}</td>
                  <td className="p-3 text-blue-600 font-semibold">${tut.total - tut.commission}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">📊 Commission vs Net Earnings</h2>
          <Bar data={chartData} />
          <p className="mt-4 text-sm text-gray-500">Commission: {commissionPercent}% | Net: {netPercent}%</p>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md text-sm text-yellow-900 flex gap-2 mt-6">
          <FaInfoCircle className="mt-0.5" />
          <p>
            Platform commission is fixed at <strong>20%</strong>. Additional fees may apply based on your chosen payout method.
            Please refer to our <a href="/help/payments" className="underline hover:text-yellow-600">payout policy</a> for full details.
          </p>
        </div>
      </div>
    </InstructorLayout>
  );
}
