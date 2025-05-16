import AdminLayout from "@/components/layouts/AdminLayout";
import { useState } from "react";

export default function MoyasarConfigPage() {
  const [form, setForm] = useState({
    apiKey: "",
    publishableKey: "",
    environment: "sandbox", // or 'live'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Saving Moyasar Config:", form);
    alert("Moyasar configuration saved (mock)");
  };

  return (
    <AdminLayout title="Configure Moyasar">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Moyasar Configuration</h1>

        <div>
          <label className="block font-medium mb-1">API Key</label>
          <input
            name="apiKey"
            value={form.apiKey}
            onChange={handleChange}
            placeholder="sk_test_..."
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Publishable Key</label>
          <input
            name="publishableKey"
            value={form.publishableKey}
            onChange={handleChange}
            placeholder="pk_test_..."
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Environment</label>
          <select
            name="environment"
            value={form.environment}
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
