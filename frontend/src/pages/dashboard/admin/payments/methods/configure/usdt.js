import AdminLayout from "@/components/layouts/AdminLayout";
import { useState } from "react";

export default function USDTConfigPage() {
  const [form, setForm] = useState({
    walletAddress: "",
    networkType: "TRC20", // or 'ERC20'
    notes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Saving USDT Config:", form);
    alert("USDT configuration saved (mock)");
  };

  return (
    <AdminLayout title="Configure USDT Wallet">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">USDT Configuration</h1>

        <input
          name="walletAddress"
          value={form.walletAddress}
          onChange={handleChange}
          placeholder="USDT Wallet Address"
          className="border px-3 py-2 rounded w-full"
        />

        <div>
          <label className="block font-medium mb-1">Network Type</label>
          <select
            name="networkType"
            value={form.networkType}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
          >
            <option value="TRC20">TRC20 (Tron)</option>
            <option value="ERC20">ERC20 (Ethereum)</option>
          </select>
        </div>

        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="Additional instructions (optional)"
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
