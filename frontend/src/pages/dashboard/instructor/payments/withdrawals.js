import { useEffect, useMemo, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { fetchInstructorWithdrawals } from "@/services/instructor/paymentService";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";

const readableStatus = (status) => {
  if (!status) return "Pending";
  const normalized = status.toLowerCase();
  if (normalized === "pending") return "Pending";
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "cancelled") return "Cancelled";
  return status;
};

export default function InstructorWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchInstructorWithdrawals();
        if (active) setWithdrawals(data || []);
      } catch (err) {
        console.error("Failed to load withdrawals", err);
        if (active) setError("Unable to load withdrawals right now.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const exportCSV = () => {
    const headers = [
      "Amount",
      "Currency",
      "Status",
      "Requested At",
      "Processed At",
      "Notes",
    ];
    const rows = withdrawals.map((withdrawal) => [
      Number(withdrawal.amount ?? 0).toFixed(2),
      withdrawal.currency || "USD",
      readableStatus(withdrawal.status),
      withdrawal.requested_at,
      withdrawal.processed_at || "",
      (withdrawal.notes || "").replace(/\n/g, " "),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "withdrawals.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const totals = useMemo(() => {
    const approved = withdrawals
      .filter((w) => w.status === "approved")
      .reduce((sum, w) => sum + Number(w.amount ?? 0), 0);
    const pending = withdrawals
      .filter((w) => w.status === "pending")
      .reduce((sum, w) => sum + Number(w.amount ?? 0), 0);
    return { approved, pending };
  }, [withdrawals]);

  if (loading) {
    return (
      <InstructorLayout>
        <div className="p-6">Loading withdrawal history...</div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="text-sm text-gray-500">Approved Withdrawals</div>
            <div className="text-xl font-semibold text-green-600">
              {formatCurrency(totals.approved)}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="text-sm text-gray-500">Pending Requests</div>
            <div className="text-xl font-semibold text-yellow-600">
              {formatCurrency(totals.pending)}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Requested</th>
                <th className="p-3">Processed</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length > 0 ? (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold text-gray-800">
                      {formatCurrency(withdrawal.amount, {
                        currency: withdrawal.currency || "USD",
                      })}
                    </td>
                    <td className="p-3 font-medium">
                      {readableStatus(withdrawal.status)}
                    </td>
                    <td className="p-3">
                      {formatDateTime(withdrawal.requested_at)}
                    </td>
                    <td className="p-3">
                      {formatDateTime(withdrawal.processed_at)}
                    </td>
                    <td className="p-3 whitespace-pre-wrap text-sm text-gray-600">
                      {withdrawal.notes || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    No withdrawal requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </InstructorLayout>
  );
}
