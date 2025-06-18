// pages/admin/ads/create.js
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import ImageCropUpload from "@/components/shared/ImageCropUpload";
import PlanLimitHint from "@/components/shared/PlanLimitHint";
import plansConfig from "@/config/plansConfig";
import { createAd } from "@/services/admin/adService";
import { FaSpinner } from "react-icons/fa";

const currentUserPlan = "basic";
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
    priority: 0,
    link: "",
    allowBranding: false,
    isActive: true,
  });
  const [error, setError] = useState(null);
  const [titleError, setTitleError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.image) {
      setError("Title and image are required.");
      return;
    }
    if (!formData.startAt || !formData.endAt) {
      setError("Start and end dates are required.");
      return;
    }
    if (new Date(formData.endAt) < new Date(formData.startAt)) {
      setError("End date cannot be before start date.");
      return;
    }

    setIsSubmitting(true);

    try {
      const blob = await fetch(formData.image).then((r) => r.blob());
      const file = new File([blob], "ad.jpg", { type: blob.type });
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("link_url", formData.link);
      payload.append("image", file);

      await createAd(payload);
      toast.success("🎉 Advertisement created successfully!");
      router.push("/dashboard/admin/ads");
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to create ad.";
      if (message.toLowerCase().includes("title")) {
        setTitleError(message);
      } else {
        setError(message);
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">🛠️ Create Advertisement</h1>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Ad Details */}
          <section className="bg-white rounded-2xl shadow border border-gray-200">
            <header className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">🎯 Ad Details</h2>
            </header>
            <div className="px-5 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={(e) => {
                    setTitleError(null);
                    handleChange(e);
                  }}
                  className={`w-full border px-3 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 ${titleError ? 'border-red-500' : 'border-gray-300'}`}
                />
                {titleError && <p className="text-sm text-red-600 mt-1">{titleError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Banner Image *</label>
                <ImageCropUpload
                  value={formData.image}
                  onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
                />
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section className="bg-white rounded-2xl shadow border border-gray-200">
            <header className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">📅 Schedule</h2>
            </header>
            <div className="px-5 py-6 grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date *</label>
                <input
                  type="date"
                  name="startAt"
                  value={formData.startAt}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date *</label>
                <input
                  type="date"
                  name="endAt"
                  value={formData.endAt}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="col-span-2">
                <PlanLimitHint plan={currentUserPlan} />
              </div>
            </div>
          </section>

          {/* Configuration */}
          <section className="bg-white rounded-2xl shadow border border-gray-200">
            <header className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">⚙️ Configuration</h2>
            </header>
            <div className="px-5 py-6 grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Ad Type *</label>
                <select
                  name="adType"
                  value={formData.adType}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="promotion">Promotion</option>
                  <option value="event">Event</option>
                  <option value="announcement">Announcement</option>
                  <option value="internal">Internal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority *</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value={0}>Low (0)</option>
                  <option value={1}>Medium (1)</option>
                  <option value={2}>High (2)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Optional Link</label>
                <input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="col-span-2 space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="allowBranding" checked={formData.allowBranding} onChange={handleChange} />
                  Enable Custom Branding (Prime only)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />
                  Activate this ad immediately
                </label>
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-xl font-medium text-white text-sm transition-all ${
                isSubmitting
                  ? "bg-yellow-400 cursor-not-allowed"
                  : "bg-yellow-600 hover:bg-yellow-700"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Creating...
                </span>
              ) : (
                "➕ Create Advertisement"
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
