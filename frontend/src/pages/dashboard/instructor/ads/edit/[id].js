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

const currentUserPlan = "basic";
const { maxAdDuration } = plansConfig[currentUserPlan];

export default function EditAdPage() {
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState(null);
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
      fetchAdById(id)
        .then((ad) => {
          if (ad) setFormData(ad);
          else setError("Ad not found.");
        })
        .catch(() => setError("Failed to load ad"));
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

      await updateAd(id, payload);
      toast.success("Ad updated successfully!");
      await notify("ad_updated", `Ad "${formData.title}" updated`);
      router.push("/dashboard/instructor/ads");
    } catch (err) {
      setError("Failed to update ad");
      toast.error("Failed to update ad");
    }
  };

  if (!formData) {
    return (
      <InstructorLayout>
        <div className="p-6">Loading ad data...</div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">✏️ Edit Advertisement</h1>
        {error && <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded mb-6">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">🎯 Ad Details</h2>
            <div className="space-y-4">
              <input type="text" name="title" value={formData.title} onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Ad Title" />
              <textarea name="description" value={formData.description} onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2" rows={3} placeholder="Description" />
              <ImageCropUpload
                value={typeof formData.image === 'string' ? formData.image : undefined}
                onChange={(file) => setFormData((prev) => ({ ...prev, image: file }))}
              />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">📅 Schedule</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input type="date" name="startAt" value={formData.startAt} onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2" />
              <input type="date" name="endAt" value={formData.endAt} onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-4">
            <select name="adType" value={formData.adType} onChange={handleChange} className="border px-3 py-2 rounded">
              <option value="promotion">Promotion</option>
              <option value="event">Event</option>
              <option value="announcement">Announcement</option>
              <option value="internal">Internal</option>
            </select>
            <select name="placement" value={formData.placement} onChange={handleChange} className="border px-3 py-2 rounded">
              <option value="dashboard">Dashboard</option>
              <option value="homepage">Homepage</option>
              <option value="email">Email</option>
              <option value="sidebar">Sidebar</option>
            </select>
            <select name="priority" value={formData.priority} onChange={handleChange} className="border px-3 py-2 rounded">
              <option value={0}>Low (0)</option>
              <option value={1}>Medium (1)</option>
              <option value={2}>High (2)</option>
            </select>
            <input type="url" name="link" value={formData.link} onChange={handleChange} placeholder="https://..." className="border px-3 py-2 rounded" />
          </section>

          <section className="grid gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="allowBranding" checked={formData.allowBranding} onChange={handleChange} />
              <span className="text-sm">Enable Custom Branding</span>
            </label>
          </section>

          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            💾 Save Changes
          </button>
        </form>
      </div>
    </InstructorLayout>
  );
}
