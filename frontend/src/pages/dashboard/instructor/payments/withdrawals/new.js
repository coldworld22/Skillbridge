import { useEffect, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useRouter } from "next/router";
import {
  fetchInstructorPaymentSummary,
  requestInstructorWithdrawal,
} from "@/services/instructor/paymentService";
import { formatCurrency } from "@/utils/currency";

export default function InstructorNewWithdrawalPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    amount: "",
    method: "Bank Transfer",
    details: "",
  });
  const [walletBalance, setWalletBalance] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let active = true;
    fetchInstructorPaymentSummary()
      .then((summary) => {
        if (active) {
          setWalletBalance(summary?.walletBalance ?? 0);
        }
      })
      .catch((err) => {
        console.error("Failed to load wallet balance", err);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountValue = Number(form.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount." });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await requestInstructorWithdrawal({
        amount: amountValue,
        method: form.method,
        details: form.details,
      });
      setMessage({
        type: "success",
        text: "Withdrawal request submitted successfully.",
      });
      setForm({ amount: "", method: "Bank Transfer", details: "" });
      setTimeout(() => {
        router.push("/dashboard/instructor/payments/withdrawals");
      }, 1500);
    } catch (err) {
      const apiMessage =
        err?.response?.data?.message || "Unable to submit withdrawal request.";
      setMessage({ type: "error", text: apiMessage });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <InstructorLayout>
      <div className="p-6 max-w-xl mx-auto text-gray-800">
        <h1 className="text-2xl font-bold mb-4">📝 New Withdrawal Request</h1>

        <div className="mb-4 bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-lg">
          <p className="text-sm uppercase tracking-wide">Available Balance</p>
          <p className="text-lg font-semibold">
            {formatCurrency(walletBalance)}
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Requests above your available wallet balance will be rejected.
          </p>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded ${
              message.type === "success"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow">
          <div>
            <label className="block mb-1 font-medium">Amount (USD)</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded"
              required
              min="1"
              step="0.01"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Payment Method</label>
            <select
              name="method"
              value={form.method}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded"
            >
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="PayPal">PayPal</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">
              {form.method === "PayPal" ? "PayPal Email" : "Bank Details (IBAN / SWIFT)"}
            </label>
            <textarea
              name="details"
              value={form.details}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded h-24"
              placeholder={form.method === "PayPal" ? "e.g., user@example.com" : "e.g., IBAN + SWIFT"}
              required
            />
          </div>

          <button
            type="submit"
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded font-medium disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </InstructorLayout>
  );
}
