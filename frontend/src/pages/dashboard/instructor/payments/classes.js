import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useEffect, useMemo, useState } from "react";
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
import { fetchInstructorPayments } from "@/services/instructor/paymentService";
import { formatCurrency } from "@/utils/currency";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const extractDate = (payment) => payment.paid_at || payment.created_at;

export default function InstructorClassEarningsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("classes");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchInstructorPayments({ itemType: "class" });
        if (active) setPayments(data || []);
      } catch (err) {
        console.error("Failed to load class earnings", err);
        if (active) setError("Unable to load class earnings right now.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const dateValue = extractDate(payment);
      if (!dateValue) return true;
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return true;

      if (startDate) {
        const start = new Date(startDate);
        if (date < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (date > end) return false;
      }
      return true;
    });
  }, [payments, startDate, endDate]);

  const classSummaries = useMemo(() => {
    const map = new Map();
    filteredPayments.forEach((payment) => {
      const key = payment.item_id || payment.id;
      const existing = map.get(key) || {
        id: key,
        title: payment.item_title || "Untitled class",
        price: payment.item_price,
        students: 0,
        totalGross: 0,
        totalNet: 0,
        commission: 0,
        currency: payment.currency || "USD",
      };

      const gross = Number(payment.amount ?? 0);
      const net = Number(payment.instructor_amount ?? 0);
      const fee =
        payment.platform_fee !== undefined
          ? Number(payment.platform_fee ?? 0)
          : gross - net;

      if (payment.status === "paid") {
        existing.students += 1;
      }

      existing.totalGross += gross;
      existing.totalNet += net;
      existing.commission += fee;
      existing.currency = payment.currency || existing.currency;

      map.set(key, existing);
    });
    return Array.from(map.values());
  }, [filteredPayments]);

  const chartData = {
    labels: classSummaries.map((cls) => cls.title),
    datasets: [
      {
        label: "Commission",
        data: classSummaries.map((cls) => cls.commission),
        backgroundColor: "#f87171",
      },
      {
        label: "Net Earnings",
        data: classSummaries.map((cls) => cls.totalNet),
        backgroundColor: "#60a5fa",
      },
    ],
  };

  const totalCommission = classSummaries.reduce(
    (sum, cls) => sum + cls.commission,
    0
  );
  const totalNet = classSummaries.reduce(
    (sum, cls) => sum + cls.totalNet,
    0
  );
  const commissionPercent =
    totalCommission + totalNet === 0
      ? 0
      : ((totalCommission / (totalCommission + totalNet)) * 100).toFixed(1);
  const netPercent = (100 - Number(commissionPercent)).toFixed(1);

  const exportCSV = () => {
    const headers = [
      "Class",
      "Students",
      "Gross Amount",
      "Platform Fee",
      "Net Earnings",
      "Average Price",
    ];
    const rows = classSummaries.map((cls) => [
      cls.title,
      cls.students,
      cls.totalGross.toFixed(2),
      cls.commission.toFixed(2),
      cls.totalNet.toFixed(2),
      cls.price !== undefined ? Number(cls.price ?? 0).toFixed(2) : "",
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "class_earnings.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    alert(
      "📄 PDF export is not yet implemented. Please contact support if you need a statement."
    );
  };

  if (loading) {
    return (
      <InstructorLayout>
        <div className="p-6">Loading class earnings...</div>
      </InstructorLayout>
    );
  }

  if (error) {
    return (
      <InstructorLayout>
        <div className="p-6 text-red-600">{error}</div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="p-6 text-gray-800 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎥 Class Earnings</h1>
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
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border p-2 rounded"
            />
          </div>
        </div>

        <div className="flex space-x-4 mb-4 border-b pb-2">
          <button
            className={`font-medium ${
              activeTab === "classes"
                ? "text-yellow-600 border-b-2 border-yellow-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("classes")}
          >
            Online Classes
          </button>
          <button
            className={`font-medium ${
              activeTab === "policy"
                ? "text-yellow-600 border-b-2 border-yellow-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("policy")}
          >
            Commission Policy
          </button>
        </div>

        {activeTab === "classes" && (
          <>
            <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-3">Title</th>
                    <th className="p-3">Students</th>
                    <th className="p-3">Avg Price</th>
                    <th className="p-3">Gross Earned</th>
                    <th className="p-3">Commission</th>
                    <th className="p-3">Net Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {classSummaries.length > 0 ? (
                    classSummaries.map((cls) => {
                      const avgPrice =
                        cls.students > 0
                          ? cls.totalGross / cls.students
                          : cls.price ?? 0;
                      return (
                        <tr key={cls.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{cls.title}</td>
                          <td className="p-3">{cls.students}</td>
                          <td className="p-3">
                            {formatCurrency(avgPrice, {
                              currency: cls.currency,
                            })}
                          </td>
                          <td className="p-3 text-gray-700">
                            {formatCurrency(cls.totalGross, {
                              currency: cls.currency,
                            })}
                          </td>
                          <td className="p-3 text-red-500">
                            {formatCurrency(cls.commission, {
                              currency: cls.currency,
                            })}
                          </td>
                          <td className="p-3 text-blue-600 font-semibold">
                            {formatCurrency(cls.totalNet, {
                              currency: cls.currency,
                            })}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">
                        No class earnings available for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                📊 Commission vs Net Earnings
              </h2>
              <Bar data={chartData} />
              <p className="mt-4 text-sm text-gray-500">
                Commission: {commissionPercent}% | Net: {netPercent}%
              </p>
            </div>
          </>
        )}

        {activeTab === "policy" && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md text-sm text-yellow-900 flex gap-2">
            <FaInfoCircle className="mt-0.5" />
            <p>
              Platform commission is calculated per enrollment and may vary if
              coupons or special pricing are applied. Please refer to our{" "}
              <a
                href="/help/payments"
                className="underline hover:text-yellow-600"
              >
                payout policy
              </a>{" "}
              for complete details.
            </p>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
