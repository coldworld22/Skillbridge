// pages/dashboard/admin/settings/languages/create.js
import AdminLayout from "@/components/layouts/AdminLayout";
import { useState } from "react";
import { useRouter } from "next/router";
import { FaSave, FaArrowLeft } from "react-icons/fa";

export default function CreateLanguagePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    label: "",
    code: "",
    direction: "ltr",
    active: true,
    file: null,
  });

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
    } else if (type === "file") {
      setForm({ ...form, file: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Language submitted:", form);
    router.push("/dashboard/admin/settings/languages");
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">➕ Add New Language</h1>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-black"
          >
            <FaArrowLeft /> Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow rounded">
          <div>
            <label className="block font-semibold mb-1">Language Name</label>
            <input
              type="text"
              name="label"
              value={form.label}
              onChange={handleChange}
              placeholder="e.g. Arabic"
              required
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Language Code</label>
            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="e.g. ar"
              required
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Text Direction</label>
            <select
              name="direction"
              value={form.direction}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="ltr">LTR (Left to Right)</option>
              <option value="rtl">RTL (Right to Left)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Translation File (optional)</label>
            <input
              type="file"
              name="file"
              accept=".json"
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="active"
              checked={form.active}
              onChange={handleChange}
              id="activeLang"
            />
            <label htmlFor="activeLang" className="text-sm font-medium">Mark as Active</label>
          </div>

          <button
            type="submit"
            className="bg-yellow-500 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FaSave /> Save Language
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
