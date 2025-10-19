import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import {
  FaArrowDown,
  FaClock,
  FaDollarSign,
  FaFileExport,
  FaWallet,
} from "react-icons/fa";
import {
  fetchInstructorPaymentSummary,
  fetchInstructorPayments,
} from "@/services/instructor/paymentService";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

const STATUS_LABELS = {
  paid: "Paid",
  awaiting_approval: "Awaiting Approval",
  pending_payment: "Pending",
  rejected: "Rejected",
};

const STATUS_COLORS = {
  paid: "text-green-600",
  awaiting_approval: "text-yellow-600",
  pending_payment: "text-yellow-600",
  rejected: "text-red-500",
};

const getMethodLabel = (payment) => {
  if (payment?.method_name) return payment.method_name;
  if (payment?.source === "subscription") return "Subscription";
  if (payment?.status === "awaiting_approval" && payment?.reference_id)
    return "Manual Review";
  return payment?.currency ? `${payment.currency} Payment` : "Payment";
};

export default function InstructorPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    walletBalance: 0,
    totalPaid: 0,
    totalPending: 0,
    lifetimeEarnings: 0,
    withdrawnTotal: 0,
    totalGross: 0,
    totalPlatformFees: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPushing, setIsPushing] = useState(false);
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryData, paymentData] = await Promise.all([
          fetchInstructorPaymentSummary(),
          fetchInstructorPayments(),
        ]);
        if (!active) {
          return;
        }
        setSummary({
          walletBalance: summaryData?.walletBalance ?? 0,
          totalPaid: summaryData?.totalPaid ?? 0,
          totalPending: summaryData?.totalPending ?? 0,
          lifetimeEarnings: summaryData?.lifetimeEarnings ?? 0,
          withdrawnTotal: summaryData?.withdrawnTotal ?? 0,
          totalGross:
            summaryData?.totalGross ?? summaryData?.lifetimeEarnings ?? 0,
          totalPlatformFees: summaryData?.totalPlatformFees ?? 0,
        });
        setPayments(paymentData || []);
      } catch (err) {
        console.error("Failed to load instructor payments", err);
        if (active) {
          setError("Failed to load payments. Please try again later.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const methodOptions = useMemo(() => {
    const set = new Set();
    payments.forEach((payment) => {
      const label = getMethodLabel(payment);
      if (label) set.add(label);
    });
    return Array.from(set);
  }, [payments]);

  const statusOptions = useMemo(() => {
    const set = new Set();
    payments.forEach((payment) => {
      if (payment.status) set.add(payment.status);
    });
    return Array.from(set);
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesMethod =
        methodFilter === "all" || getMethodLabel(payment) === methodFilter;
      const matchesStatus =
        statusFilter === "all" || payment.status === statusFilter;
      return matchesMethod && matchesStatus;
    });
  }, [methodFilter, statusFilter, payments]);

  const statusBreakdown = useMemo(() => {
    return payments.reduce((acc, payment) => {
      const key = payment.status || "unknown";
      if (!acc[key]) {
        acc[key] = { count: 0, totalNet: 0, currency: payment.currency };
      }
      acc[key].count += 1;
      acc[key].totalNet += Number(payment.instructor_amount ?? 0);
      if (payment.currency) {
        acc[key].currency = payment.currency;
      }
      return acc;
    }, {});
  }, [payments]);

  const filteredTotals = useMemo(() => {
    return filteredPayments.reduce(
      (
        acc,
        { amount, instructor_amount, platform_fee, paid_at, created_at, currency }
      ) => {
        const gross = Number(amount ?? 0);
        const net = Number(instructor_amount ?? 0);
        const fee =
          platform_fee !== undefined ? Number(platform_fee ?? 0) : gross - net;
        acc.count += 1;
        acc.totalGross += gross;
        acc.totalNet += net;
        acc.totalFee += fee;
        const dateValue = paid_at || created_at;
        if (dateValue) {
          const timestamp = Date.parse(dateValue);
          if (!Number.isNaN(timestamp) && timestamp > acc.latestTimestamp) {
            acc.latestTimestamp = timestamp;
            acc.latestCurrency = currency;
          }
        }
        return acc;
      },
      {
        count: 0,
        totalGross: 0,
        totalNet: 0,
        totalFee: 0,
        latestTimestamp: -Infinity,
        latestCurrency: undefined,
      }
    );
  }, [filteredPayments]);

  const latestPaymentDate =
    filteredTotals.latestTimestamp === -Infinity
      ? null
      : new Date(filteredTotals.latestTimestamp);
  const filteredCurrency =
    filteredTotals.latestCurrency || filteredPayments[0]?.currency;

  const totalEarnings = summary.lifetimeEarnings ?? 0;
  const pendingBalance = summary.totalPending ?? 0;
  const withdrawn = summary.withdrawnTotal ?? 0;
  const walletBalance = summary.walletBalance ?? 0;
  const totalPaid = summary.totalPaid ?? 0;
  const totalPlatformFees = summary.totalPlatformFees ?? 0;
  const totalGross = summary.totalGross ?? totalEarnings;

  const redirectToNewWithdrawal = () => {
    if (isPushing) return;
    setIsPushing(true);
    router
      .push("/dashboard/instructor/payments/withdrawals/new")
      .finally(() => setIsPushing(false));
  };

  const exportCSV = () => {
    const headers = [
      "Item",
      "Gross Amount",
      "Platform Fee",
      "Net Amount",
      "Date",
      "Status",
      "Method",
    ];
    const rows = filteredPayments.map((payment) => [
      payment.item_title || payment.item_type,
      Number(payment.amount ?? 0).toFixed(2),
      Number(payment.platform_fee ?? 0).toFixed(2),
      Number(payment.instructor_amount ?? 0).toFixed(2),
      formatDate(payment.paid_at || payment.created_at),
      STATUS_LABELS[payment.status] || payment.status,
      getMethodLabel(payment),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "payments.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const earningsByType = useMemo(() => {
    const map = new Map();

    payments.forEach((payment) => {
      const type = payment.item_type || "other";
      const entry = map.get(type) || {
        orders: 0,
        gross: 0,
        net: 0,
        fees: 0,
        currency: payment.currency || "USD",
      };

      entry.orders += 1;
      entry.gross += Number(payment.amount ?? 0);
      entry.net += Number(payment.instructor_amount ?? 0);
      entry.fees +=
        payment.platform_fee !== undefined
          ? Number(payment.platform_fee ?? 0)
          : Number(payment.amount ?? 0) - Number(payment.instructor_amount ?? 0);
      entry.currency = payment.currency || entry.currency;

      map.set(type, entry);
    });

    return Array.from(map.entries()).map(([type, values]) => ({
      type,
      ...values,
    }));
  }, [payments]);

  if (loading) {
    return (
      <InstructorLayout>
        <div className="p-6">Loading payment data...</div>
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
        <h1 className="text-2xl font-bold">💰 Instructor Payments</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="bg-white p-4 shadow rounded-xl flex items-center gap-4">
            <FaDollarSign className="text-2xl text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Lifetime Earnings</p>
              <h2 className="text-xl font-semibold">
                {formatCurrency(totalEarnings)}
              </h2>
            </div>
          </div>
          <div className="bg-white p-4 shadow rounded-xl flex items-center gap-4">
            <FaClock className="text-2xl text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Pending Earnings</p>
              <h2 className="text-xl font-semibold">
                {formatCurrency(pendingBalance)}
              </h2>
            </div>
          </div>
          <div className="bg-white p-4 shadow rounded-xl flex items-center gap-4">
            <FaWallet className="text-2xl text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">Paid to Wallet</p>
              <h2 className="text-xl font-semibold">
                {formatCurrency(totalPaid)}
              </h2>
            </div>
          </div>
          <div className="bg-white p-4 shadow rounded-xl flex items-center gap-4">
            <FaWallet className="text-2xl text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Total Withdrawn</p>
              <h2 className="text-xl font-semibold">
                {formatCurrency(withdrawn)}
              </h2>
            </div>
          </div>
          <div className="bg-white p-4 shadow rounded-xl flex items-center gap-4">
            <FaDollarSign className="text-2xl text-red-500" />
            <div>
              <p className="text-sm text-gray-500">Platform Fees</p>
              <h2 className="text-xl font-semibold">
                {formatCurrency(totalPlatformFees)}
              </h2>
            </div>
          </div>
          <div className="bg-white p-4 shadow rounded-xl flex items-center gap-4">
            <FaDollarSign className="text-2xl text-indigo-500" />
            <div>
              <p className="text-sm text-gray-500">Gross Revenue</p>
              <h2 className="text-xl font-semibold">
                {formatCurrency(totalGross)}
              </h2>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-lg flex items-center gap-3">
          <FaWallet />
          <div>
            <p className="text-sm uppercase tracking-wide">Current Wallet Balance</p>
            <p className="text-lg font-semibold">
              {formatCurrency(walletBalance)}
            </p>
          </div>
        </div>

        {earningsByType.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Earnings by Item Type</h2>
              <p className="text-sm text-gray-500">
                Track how each product contributes to your revenue.
              </p>
            </div>
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3">Item Type</th>
                  <th className="p-3">Orders</th>
                  <th className="p-3">Gross</th>
                  <th className="p-3">Net Earned</th>
                  <th className="p-3">Platform Fees</th>
                </tr>
              </thead>
              <tbody>
                {earningsByType.map((row) => (
                  <tr key={row.type} className="border-b last:border-b-0">
                    <td className="p-3 font-medium capitalize">
                      {row.type.replace(/_/g, " ")}
                    </td>
                    <td className="p-3">{row.orders}</td>
                    <td className="p-3">
                      {formatCurrency(row.gross, row.currency)}
                    </td>
                    <td className="p-3">
                      {formatCurrency(row.net, row.currency)}
                    </td>
                    <td className="p-3 text-red-500">
                      {formatCurrency(row.fees, row.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/instructor/payments/history"
            className="block bg-gray-50 hover:bg-gray-100 p-4 rounded shadow text-center"
          >
            📜 Payment History
          </Link>
          <Link
            href="/dashboard/instructor/payments/withdrawals"
            className="block bg-gray-50 hover:bg-gray-100 p-4 rounded shadow text-center"
          >
            🧾 Withdrawals
          </Link>
          <Link
            href="/dashboard/instructor/payments/settings"
            className="block bg-gray-50 hover:bg-gray-100 p-4 rounded shadow text-center"
          >
            ⚙️ Payment Settings
          </Link>
          <Link
            href="/dashboard/instructor/payments/commissions"
            className="block bg-gray-50 hover:bg-gray-100 p-4 rounded shadow text-center"
          >
            📉 Commission &amp; Deductions
          </Link>
          <Link
            href="/dashboard/instructor/payments/classes"
            className="block bg-gray-50 hover:bg-gray-100 p-4 rounded shadow text-center"
          >
            🎥 Online Class Earnings
          </Link>
          <Link
            href="/dashboard/instructor/payments/tutorials"
            className="block bg-gray-50 hover:bg-gray-100 p-4 rounded shadow text-center"
          >
            📘 Tutorial Earnings
          </Link>
          <Link
            href="/dashboard/instructor/payments/books"
            className="block bg-gray-50 hover:bg-gray-100 p-4 rounded shadow text-center"
          >
            📚 Book Earnings
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Transaction History</h2>
            <div className="flex gap-2 flex-wrap justify-end">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">All Methods</option>
                {methodOptions.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">All Statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status] || status}
                  </option>
                ))}
              </select>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded"
              >
                <FaFileExport /> Export CSV
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={redirectToNewWithdrawal}
                disabled={isPushing}
              >
                <FaArrowDown /> Request Withdrawal
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Filtered Transactions
              </p>
              <p className="text-2xl font-semibold text-gray-800">
                {filteredTotals.count}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Net Earnings
              </p>
              <p className="text-2xl font-semibold text-green-600">
                {formatCurrency(filteredTotals.totalNet, filteredCurrency)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Platform Fees
              </p>
              <p className="text-2xl font-semibold text-red-500">
                {formatCurrency(filteredTotals.totalFee, filteredCurrency)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Last Payment
              </p>
              <p className="text-lg font-semibold text-gray-800">
                {latestPaymentDate ? formatDate(latestPaymentDate) : "—"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {Object.entries(statusBreakdown).map(([status, data]) => (
              <div key={status} className="bg-white border rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {STATUS_LABELS[status] || status}
                </p>
                <p className="text-xl font-semibold text-gray-800">
                  {data.count} tx
                </p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(data.totalNet, data.currency)} net
                </p>
              </div>
            ))}
          </div>

          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Item</th>
                <th className="p-3">Net Amount</th>
                <th className="p-3">Gross</th>
                <th className="p-3">Platform Fee</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Method</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => {
                  const method = getMethodLabel(payment);
                  const statusLabel =
                    STATUS_LABELS[payment.status] || payment.status;
                  const statusClass =
                    STATUS_COLORS[payment.status] || "text-gray-600";
                  const displayDate = payment.paid_at || payment.created_at;
                  return (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {payment.item_title || "Untitled"}
                          </span>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">
                            {payment.item_type}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-green-600">
                        {formatCurrency(payment.instructor_amount, {
                          currency: payment.currency,
                        })}
                      </td>
                      <td className="p-3">
                        {formatCurrency(payment.amount, {
                          currency: payment.currency,
                        })}
                      </td>
                      <td className="p-3 text-red-500">
                        {formatCurrency(payment.platform_fee, {
                          currency: payment.currency,
                        })}
                      </td>
                      <td className="p-3">{formatDate(displayDate)}</td>
                      <td className={`p-3 font-medium ${statusClass}`}>
                        {statusLabel}
                      </td>
                      <td className="p-3">{method}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    No transactions found yet.
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
