import AdminLayout from "@/components/layouts/AdminLayout";
import { useState } from "react";

export default function PayPalConfigPage() {
  const [form, setForm] = useState({
    clientId: "",
    clientSecret: "",
    mode: "sandbox", // or 'live'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Saving PayPal Config:", form);
    alert("PayPal configuration saved (mock)");
  };

  return (
    <AdminLayout title="Configure PayPal">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">PayPal Configuration</h1>

        <div>
          <label className="block font-medium mb-1">Client ID</label>
          <input
            name="clientId"
            value={form.clientId}
            onChange={handleChange}
            placeholder="AXZk2Y1f...."
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Client Secret</label>
          <input
            name="clientSecret"
            value={form.clientSecret}
            onChange={handleChange}
            placeholder="EXhJQX..."
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Mode</label>
          <select
            name="mode"
            value={form.mode}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
          >
            <option value="sandbox">Sandbox (Testing)</option>
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
