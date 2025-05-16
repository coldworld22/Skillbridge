import { useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";

export default function InstructorNewWithdrawalPage() {
  const [form, setForm] = useState({
    amount: "",
    method: "Bank Transfer",
    details: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Withdrawal requested:\nAmount: $${form.amount}\nMethod: ${form.method}\nDetails: ${form.details}`);
    setForm({ amount: "", method: "Bank Transfer", details: "" });
  };

  return (
    <InstructorLayout>
      <div className="p-6 max-w-xl mx-auto text-gray-800">
        <h1 className="text-2xl font-bold mb-4">📝 New Withdrawal Request</h1>

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
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded font-medium"
          >
            Submit Request
          </button>
        </form>
      </div>
    </InstructorLayout>
  );
}
