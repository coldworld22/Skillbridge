import AdminLayout from "@/components/layouts/AdminLayout";
import { useState } from "react";

export default function BinancePayConfigPage() {
  const [form, setForm] = useState({
    binancePayId: "",
    apiKey: "",
    secretKey: "",
    environment: "sandbox", // or 'live'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Saving Binance Pay Config:", form);
    alert("Binance Pay configuration saved (mock)");
  };

  return (
    <AdminLayout title="Configure Binance Pay">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Binance Pay Configuration</h1>

        <input
          name="binancePayId"
          value={form.binancePayId}
          onChange={handleChange}
          placeholder="Binance Pay ID"
          className="border px-3 py-2 rounded w-full"
        />

        <input
          name="apiKey"
          value={form.apiKey}
          onChange={handleChange}
          placeholder="API Key"
          className="border px-3 py-2 rounded w-full"
        />

        <input
          name="secretKey"
          value={form.secretKey}
          onChange={handleChange}
          placeholder="Secret Key"
          className="border px-3 py-2 rounded w-full"
        />

        <div>
          <label className="block font-medium mb-1">Environment</label>
          <select
            name="environment"
            value={form.environment}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
          >
            <option value="sandbox">Sandbox (Test)</option>
            <option value="live">Live</option>
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
