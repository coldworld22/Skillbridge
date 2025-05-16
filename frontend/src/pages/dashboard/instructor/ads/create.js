// pages/admin/ads/create.js
import { useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import ImageCropUpload from "@/components/shared/ImageCropUpload";
import PlanLimitHint from "@/components/shared/PlanLimitHint";
import plansConfig from "@/config/plansConfig";

const currentUserPlan = "basic"; // "basic" | "regular" | "prime"
const { maxAdDuration } = plansConfig[currentUserPlan];

export default function CreateAdPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    startAt: "",
    endAt: "",
    targetRoles: [],
    adType: "promotion",
    placement: "dashboard",
    priority: 0,
    link: "",
    allowBranding: false,
    isActive: true,
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "targetRoles") {
      const role = value;
      setFormData((prev) => ({
        ...prev,
        targetRoles: checked
          ? [...prev.targetRoles, role]
          : prev.targetRoles.filter((r) => r !== role),
      }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "priority") {
      setFormData((prev) => ({ ...prev, priority: Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const start = new Date(formData.startAt);
    const end = new Date(formData.endAt);
    const diffInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (!formData.title || !formData.image || !formData.startAt || !formData.endAt) {
      setError("Please fill in all required fields.");
      return;
    }
    if (start > end) {
      setError("End date must be after start date.");
      return;
    }
    if (diffInDays > maxAdDuration) {
      setError(`Your plan only allows ads for up to ${maxAdDuration} days.`);
      return;
    }

    console.log("Creating ad:", formData);
    alert("Ad created successfully!");
    router.push("/admin/ads");
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">📢 Create New Advertisement</h1>
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">🎯 Ad Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium">Title *</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-blue-500" />
              </div>
              <div>
                <label className="block font-medium">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2" rows={3} />
              </div>
              <div>
                <label className="block font-medium">Banner Image *</label>
                <ImageCropUpload
                  value={formData.image}
                  onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">📅 Schedule</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium">Start Date *</label>
                <input type="date" name="startAt" value={formData.startAt} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block font-medium">End Date *</label>
                <input type="date" name="endAt" value={formData.endAt} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2" />
              </div>
            </div>
            <PlanLimitHint plan={currentUserPlan} />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">⚙️ Configuration</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium">Ad Type *</label>
                <select name="adType" value={formData.adType} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2">
                  <option value="promotion">Promotion</option>
                  <option value="event">Event</option>
                  <option value="announcement">Announcement</option>
                  <option value="internal">Internal</option>
                </select>
              </div>
             
              <div>
                <label className="block font-medium">Priority *</label>
                <select name="priority" value={formData.priority} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2">
                  <option value={0}>Low (0)</option>
                  <option value={1}>Medium (1)</option>
                  <option value={2}>High (2)</option>
                </select>
              </div>
              <div>
                <label className="block font-medium">Optional Link</label>
                <input type="url" name="link" value={formData.link} onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full border border-gray-300 rounded px-3 py-2" />
              </div>
            </div>
          </section>

          <section className="grid gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="allowBranding"
                checked={formData.allowBranding} onChange={handleChange} />
              <span className="text-sm">Enable Custom Branding (Prime only)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isActive"
                checked={formData.isActive} onChange={handleChange} />
              <span className="text-sm">Activate this ad immediately</span>
            </label>
          </section>

          <button type="submit"
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-6 py-2 rounded transition">
            ➕ Create Ad
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}