import AdminLayout from "@/components/layouts/AdminLayout";
import { useState } from "react";

export default function StripeConfigPage() {
  const [form, setForm] = useState({
    publicKey: "",
    secretKey: "",
    webhookSecret: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Saving Stripe Config:", form);
    alert("Stripe configuration saved (mock)");
  };

  return (
    <AdminLayout title="Configure Stripe">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Stripe Configuration</h1>

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
          <label className="block font-medium mb-1">Webhook Secret</label>
          <input
            name="webhookSecret"
            value={form.webhookSecret}
            onChange={handleChange}
            placeholder="whsec_..."
            className="border px-3 py-2 rounded w-full"
          />
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
