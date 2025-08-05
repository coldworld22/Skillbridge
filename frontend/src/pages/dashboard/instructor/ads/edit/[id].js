// pages/dashboard/instructor/ads/edit/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import ImageCropUpload from "@/components/shared/ImageCropUpload";
import plansConfig from "@/config/plansConfig";
import { fetchAdById, updateAd } from "@/services/admin/adService";
import { toast } from "react-toastify";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import { FiSave, FiCalendar, FiLink, FiType, FiInfo, FiImage } from "react-icons/fi";
import { IoMdAlert } from "react-icons/io";
import { ImSpinner8 } from "react-icons/im";

const currentUserPlan = "basic";
const { maxAdDuration } = plansConfig[currentUserPlan];

export default function EditAdPage() {
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const user = useAuthStore((s) => s.user);
  const refreshNotifications = useNotificationStore((s) => s.fetch);
  const refreshMessages = useMessageStore((s) => s.fetch);

  const notify = async (type, message) => {
    try {
      await createNotification({ user_id: user.id, type, message });
      await sendChatMessage(user.id, { text: message });
      refreshNotifications?.();
      refreshMessages?.();
    } catch (err) {
      console.error("[EditAdPage] notification error", err);
    }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchAdById(id)
        .then((ad) => {
          if (ad) {
            setFormData({
              ...ad,
              startAt: ad.startAt.split('T')[0],
              endAt: ad.endAt.split('T')[0]
            });
          } else {
            setError("Ad not found.");
            toast.error("Ad not found");
            router.push("/dashboard/instructor/ads");
          }
        })
        .catch((err) => {
          setError("Failed to load ad");
          toast.error("Failed to load ad data");
          console.error("[EditAdPage] fetch error:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

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
    setSubmitting(true);
    setError(null);
    
    const start = new Date(formData.startAt);
    const end = new Date(formData.endAt);
    const diffInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Validation
    if (!formData.title || !formData.image || !formData.startAt || !formData.endAt) {
      setError("Please fill in all required fields.");
      setSubmitting(false);
      return;
    }
    if (start > end) {
      setError("End date must be after start date.");
      setSubmitting(false);
      return;
    }
    if (diffInDays > maxAdDuration) {
      setError(`Your plan only allows ads for up to ${maxAdDuration} days. Please upgrade to run longer campaigns.`);
      setSubmitting(false);
      return;
    }

    try {
      const payload = new FormData();
      if (formData.image instanceof Blob) {
        const file =
          formData.image instanceof File
            ? formData.image
            : new File([formData.image], "ad.jpg", { type: formData.image.type || "image/jpeg" });
        payload.append("image", file);
      }
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("link_url", formData.link);
      payload.append("adType", formData.adType);
      payload.append("placement", formData.placement);
      payload.append("priority", formData.priority);
      payload.append("allowBranding", formData.allowBranding);
      payload.append("startAt", new Date(formData.startAt).toISOString());
      payload.append("endAt", new Date(formData.endAt).toISOString());

      await updateAd(id, payload);
      toast.success("Ad updated successfully!", { autoClose: 2000 });
      await notify("ad_updated", `Ad "${formData.title}" was updated`);
      setTimeout(() => router.push("/dashboard/instructor/ads"), 1500);
    } catch (err) {
      console.error("[EditAdPage] update error:", err);
      setError(err.response?.data?.message || "Failed to update ad. Please try again.");
      toast.error("Failed to update ad");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <InstructorLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <ImSpinner8 className="animate-spin text-3xl text-blue-600" />
            <p className="text-gray-600">Loading ad data...</p>
          </div>
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FiType className="text-blue-600" />
            Edit Advertisement
          </h1>
          <p className="text-gray-600 mt-1">Update your ad details and settings</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r">
            <div className="flex items-center gap-2 text-red-700">
              <IoMdAlert className="text-lg" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiInfo className="text-blue-600" />
              Ad Details
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                  placeholder="Enter ad title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition min-h-[120px]"
                  placeholder="Enter ad description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <FiImage />
                  Ad Image *
                </label>
                <ImageCropUpload
                  value={typeof formData.image === 'string' ? formData.image : undefined}
                  onChange={(file) => setFormData((prev) => ({ ...prev, image: file }))}
                  aspectRatio={16/9}
                  className="border-2 border-dashed border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Recommended size: 1200×675 pixels (16:9 aspect ratio)</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiCalendar className="text-blue-600" />
              Schedule
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  name="startAt"
                  value={formData.startAt}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="date"
                  name="endAt"
                  value={formData.endAt}
                  onChange={handleChange}
                  min={formData.startAt || new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>
            {formData.startAt && formData.endAt && (
              <p className="text-sm text-gray-600 mt-3">
                Duration: {Math.ceil(
                  (new Date(formData.endAt) - new Date(formData.startAt)) /
                    (1000 * 60 * 60 * 24)
                )} days
                (Max: {maxAdDuration} days)
              </p>
            )}
          </section>

          <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Ad Settings</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Type</label>
                <select
                  name="adType"
                  value={formData.adType}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                >
                  <option value="promotion">Promotion</option>
                  <option value="event">Event</option>
                  <option value="announcement">Announcement</option>
                  <option value="internal">Internal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placement</label>
                <select
                  name="placement"
                  value={formData.placement}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                >
                  <option value="dashboard">Dashboard</option>
                  <option value="homepage">Homepage</option>
                  <option value="email">Email</option>
                  <option value="sidebar">Sidebar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                >
                  <option value={0}>Low (0)</option>
                  <option value={1}>Medium (1)</option>
                  <option value={2}>High (2)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <FiLink />
                  Link URL
                </label>
                <input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowBranding"
                name="allowBranding"
                checked={formData.allowBranding}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="allowBranding" className="text-sm font-medium text-gray-700">
                Enable Custom Branding
              </label>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={() => router.push("/dashboard/instructor/ads")}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <ImSpinner8 className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </InstructorLayout>
  );
}