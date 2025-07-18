import AdminLayout from "@/components/layouts/AdminLayout";
import { useRouter } from "next/router";
import { useState } from "react";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import { createMethod } from "@/services/admin/paymentMethodService";

export default function CreatePaymentMethodPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    type: "Gateway",
    icon: "",
    active: true,
    is_default: false,
    settings: {},
    settingsText: "{}",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "settings") {
      setForm((prev) => ({ ...prev, settingsText: value }));
    } else {
      setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let settings = {};
      try {
        settings = form.settingsText ? JSON.parse(form.settingsText) : {};
      } catch (err) {
        alert("Invalid JSON in settings");
        return;
      }
      await createMethod({
        name: form.name,
        type: form.type,
        icon: form.icon,
        active: form.active,
        is_default: form.is_default,
        settings,
      });
      router.push("/dashboard/admin/payments");
    } catch (err) {
      console.error("Failed to create method", err);
      alert("Failed to create method");
    }
  };

  return (
    <AdminLayout title="Add Payment Method">
      <div className="max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Add New Payment Method</h1>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-black"
          >
            <FaArrowLeft /> Back
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded shadow">
          <div>
            <label className="block font-semibold mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded"
              placeholder="e.g. Stripe"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="Gateway">Gateway</option>
              <option value="Manual">Manual</option>
              <option value="Crypto">Crypto</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Icon URL (optional)</label>
            <input
              type="text"
              name="icon"
              value={form.icon}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Settings (JSON)</label>
            <textarea
              name="settings"
              rows={5}
              value={form.settingsText}
              onChange={handleChange}
              className="w-full border p-2 rounded font-mono text-sm"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="active"
              checked={form.active}
              onChange={handleChange}
            />
            <span className="text-sm font-medium">Active</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_default"
              checked={form.is_default}
              onChange={handleChange}
            />
            <span className="text-sm font-medium">Default Method</span>
          </label>
          <button
            type="submit"
            className="bg-yellow-500 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FaSave /> Save Method
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
