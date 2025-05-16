import AdminLayout from "@/components/layouts/AdminLayout";
import { useState } from "react";

export default function BankTransferConfigPage() {
  const [form, setForm] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    iban: "",
    swiftCode: "",
    instructions: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Saving Bank Transfer Config:", form);
    alert("Bank transfer configuration saved (mock)");
  };

  return (
    <AdminLayout title="Configure Bank Transfer">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Bank Transfer Configuration</h1>

        <input
          name="bankName"
          value={form.bankName}
          onChange={handleChange}
          placeholder="Bank Name"
          className="border px-3 py-2 rounded w-full"
        />

        <input
          name="accountName"
          value={form.accountName}
          onChange={handleChange}
          placeholder="Account Holder Name"
          className="border px-3 py-2 rounded w-full"
        />

        <input
          name="accountNumber"
          value={form.accountNumber}
          onChange={handleChange}
          placeholder="Account Number"
          className="border px-3 py-2 rounded w-full"
        />

        <input
          name="iban"
          value={form.iban}
          onChange={handleChange}
          placeholder="IBAN"
          className="border px-3 py-2 rounded w-full"
        />

        <input
          name="swiftCode"
          value={form.swiftCode}
          onChange={handleChange}
          placeholder="SWIFT Code"
          className="border px-3 py-2 rounded w-full"
        />

        <textarea
          name="instructions"
          value={form.instructions}
          onChange={handleChange}
          placeholder="Transfer Instructions (optional)"
          className="border px-3 py-2 rounded w-full"
          rows={3}
        />

        <button
          onClick={handleSave}
          className="bg-indigo-600 text-white px-6 py-2 rounded shadow"
        >
          Save
        </button>
      </div>
    </AdminLayout>
  );
}
