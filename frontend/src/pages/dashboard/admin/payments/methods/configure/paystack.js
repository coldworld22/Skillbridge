import AdminLayout from "@/components/layouts/AdminLayout";
import { useState } from "react";

export default function PaystackConfigPage() {
  const [form, setForm] = useState({
    publicKey: "",
    secretKey: "",
    currency: "NGN", // Default currency, can be updated
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Saving Paystack Config:", form);
    alert("Paystack configuration saved (mock)");
  };

  return (
    <AdminLayout title="Configure Paystack">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Paystack Configuration</h1>

        <div>
          <label className="block font-medium mb-1">Public Key</label>
          <input
            name="publicKey"
            value={form.publicKey}
            onChange={handleChange}
            placeholder="pk_live_..."
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Secret Key</label>
          <input
            name="secretKey"
            value={form.secretKey}
            onChange={handleChange}
            placeholder="sk_live_..."
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Currency</label>
          <select
            name="currency"
            value={form.currency}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
          >
            <option value="NGN">Nigerian Naira (NGN)</option>
            <option value="GHS">Ghanaian Cedi (GHS)</option>
            <option value="ZAR">South African Rand (ZAR)</option>
            <option value="USD">US Dollar (USD)</option>
          </select>
        </div>

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
