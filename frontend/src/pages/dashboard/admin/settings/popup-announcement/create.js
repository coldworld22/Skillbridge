import AdminLayout from "@/components/layouts/AdminLayout";
import { useState } from "react";
import dynamic from "next/dynamic";
import { FaSave, FaEye } from "react-icons/fa";

const RichTextEditor = dynamic(() => import("react-quill"), { ssr: false });

export default function CreateAnnouncementForm() {
  const [form, setForm] = useState({
    title: "",
    message: "",
    audience: "all",
    pages: [],
    start: "",
    end: "",
    position: "center",
    theme: "yellow",
    oncePerSession: true,
    active: true,
  });

  const allPages = ["/", "/courses", "/about", "/dashboard/student", "/contact"];

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCheckboxChange = (page) => {
    const updated = form.pages.includes(page)
      ? form.pages.filter((p) => p !== page)
      : [...form.pages, page];
    handleChange("pages", updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.message || !form.start || !form.end) return;
    alert("✅ Announcement saved!");
    console.log("📤 Submitted:", form);
    // POST to API here
  };

  return (
    <AdminLayout title="Create Popup Announcement">
      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          📝 Create Popup Announcement
        </h1>

        {/* TITLE */}
        <div>
          <label className="block font-semibold mb-1">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Internal title for this popup"
            required
          />
        </div>

        {/* MESSAGE */}
        <div>
          <label className="block font-semibold mb-1">Message (Rich Text)</label>
          <RichTextEditor
            value={form.message}
            onChange={(val) => handleChange("message", val)}
            theme="snow"
          />
        </div>

        {/* AUDIENCE */}
        <div>
          <label className="block font-semibold mb-1">Target Audience</label>
          <select
            value={form.audience}
            onChange={(e) => handleChange("audience", e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="all">🌐 All Visitors</option>
            <option value="logged-in">🔐 Logged-In Users</option>
            <option value="student">🎓 Students Only</option>
            <option value="instructor">🧑‍🏫 Instructors Only</option>
          </select>
        </div>

        {/* TARGET PAGES */}
        <div>
          <label className="block font-semibold mb-2">Target Pages</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {allPages.map((page) => (
              <label key={page} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.pages.includes(page)}
                  onChange={() => handleCheckboxChange(page)}
                />
                <span className="text-gray-700">{page}</span>
              </label>
            ))}
          </div>
        </div>

        {/* TIMING */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">📆 Schedule</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium mb-1">Start Date/Time</label>
              <input
                type="datetime-local"
                className="w-full border rounded px-3 py-2"
                value={form.start}
                onChange={(e) => handleChange("start", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">End Date/Time</label>
              <input
                type="datetime-local"
                className="w-full border rounded px-3 py-2"
                value={form.end}
                onChange={(e) => handleChange("end", e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* STYLE */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">🎨 Appearance</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium mb-1">Popup Position</label>
              <select
                value={form.position}
                onChange={(e) => handleChange("position", e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="center">🟨 Center</option>
                <option value="top">⬆ Top Banner</option>
                <option value="bottom">⬇ Bottom Sticky</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Theme Color</label>
              <select
                value={form.theme}
                onChange={(e) => handleChange("theme", e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="yellow">🌕 Yellow</option>
                <option value="blue">🔵 Blue</option>
                <option value="green">🟢 Green</option>
                <option value="red">🔴 Red</option>
              </select>
            </div>
          </div>
        </div>

        {/* TOGGLES */}
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.oncePerSession}
              onChange={() => handleChange("oncePerSession", !form.oncePerSession)}
            />
            Show only once per session
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={() => handleChange("active", !form.active)}
            />
            Active (popup will be visible)
          </label>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={!form.title || !form.message || !form.start || !form.end}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded shadow disabled:opacity-50"
          >
            <FaSave className="inline mr-2" /> Save
          </button>
          <button
            type="button"
            className="border px-6 py-2 rounded shadow text-gray-800 hover:bg-gray-100"
            onClick={() => alert("🔍 Preview not implemented")}
          >
            <FaEye className="inline mr-2" /> Preview
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
