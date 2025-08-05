// pages/dashboard/instructor/ads/create.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import plansConfig from "@/config/plansConfig";
import { createAd } from "@/services/admin/adService";
import { FaSpinner } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import useAuthStore from "@/store/auth/authStore";
import PreviewModal from "@/components/admin/ads/PreviewModalinstrutor";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export default function CreateAdPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation('dashboard', { keyPrefix: 'adsCreatePage' });
  const { t: tp } = useTranslation('dashboard', { keyPrefix: 'adsPage' });
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
      console.error("[CreateAdPage] notification error", err);
    }
  };

  const planKey = user?.plan || 'basic';
  const { allowBranding: allowBrandingEnabled } =
    plansConfig[planKey] || { allowBranding: false };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null,
    startAt: "",
    endAt: "",
    targetRoles: [],
    adType: "promotion",
    priority: 0,
    link: "",
    allowBranding: false,
  });
  const [error, setError] = useState(null);
  const [titleError, setTitleError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaType, setMediaType] = useState('image');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(t('invalid_image_type'));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError(t('image_too_large'));
      return;
    }
    const url = URL.createObjectURL(file);
    setError(null);
    setFormData((prev) => ({ ...prev, image: file }));
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(url);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError(t('invalid_video_type'));
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      setError(t('video_too_large'));
      return;
    }
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
    setError(null);
  };

  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [videoPreview, imagePreview]);

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

    if (!formData.title || (mediaType === 'image' && !formData.image) || (mediaType === 'video' && !videoFile)) {
      setError(t('title_image_required'));
      return;
    }
    if (!formData.startAt || !formData.endAt) {
      setError(t('dates_required'));
      return;
    }
    if (new Date(formData.endAt) < new Date(formData.startAt)) {
      setError(t('end_before_start'));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("link_url", formData.link);
      payload.append("start_at", formData.startAt);
      payload.append("end_at", formData.endAt);
      payload.append("ad_type", formData.adType);
      payload.append("priority", String(formData.priority));
      payload.append("allow_branding", formData.allowBranding ? "true" : "false");
      payload.append("target_roles", JSON.stringify(formData.targetRoles));

      if (mediaType === 'image') {
        payload.append('image', formData.image);
      } else if (mediaType === 'video') {
        payload.append('video', videoFile);
      }

      await createAd(payload);
      toast.success(t('success'));
      const msg = t('ad_created_notification', { title: formData.title });
      await notify('ad_created', msg);
      router.push("/dashboard/instructor/ads");
    } catch (err) {
      const message = err?.response?.data?.message || t('failed');
      if (message.toLowerCase().includes("title")) {
        setTitleError(t('title_exists'));
      } else {
        setError(message);
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <InstructorLayout>
      <div className="max-w-4xl mx-auto p-6" dir={i18n.dir()}>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">🛠️ {t('title')}</h1>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Ad Details */}
          <section className="bg-white rounded-2xl shadow border border-gray-200">
            <header className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">🎯 {t('ad_details')}</h2>
            </header>
            <div className="px-5 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('title_label')} *</label>
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
                <label className="block text-sm font-medium mb-1">{t('description_label')}</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium mb-1">{t('media_type')}</label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="image">{t('image')}</option>
                  <option value="video">{t('video')}</option>
                </select>
              </div>
              {mediaType === 'image' ? (
                <div>
                  <label className="block text-sm font-medium mb-1">{t('image_label')} *</label>
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded border mb-2"
                    />
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1">{t('video_label')} *</label>
                  {videoPreview && (
                    <video src={videoPreview} className="w-full h-48 mb-2" controls />
                  )}
                  <input type="file" accept="video/*" onChange={handleVideoChange} />
                </div>
              )}
            </div>
          </section>

          {/* Schedule */}
          <section className="bg-white rounded-2xl shadow border border-gray-200">
            <header className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">📅 {t('schedule')}</h2>
            </header>
            <div className="px-5 py-6 grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">{t('start_date')} *</label>
                <input
                  type="date"
                  name="startAt"
                  value={formData.startAt}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('end_date')} *</label>
                <input
                  type="date"
                  name="endAt"
                  value={formData.endAt}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </section>

          {/* Target Audience */}
          <section className="bg-white rounded-2xl shadow border border-gray-200">
            <header className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">👥 {t('target_audience')}</h2>
            </header>
            <div className="px-5 py-6 space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="targetRoles"
                  value="student"
                  checked={formData.targetRoles.includes('student')}
                  onChange={handleChange}
                />
                {tp('student')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="targetRoles"
                  value="instructor"
                  checked={formData.targetRoles.includes('instructor')}
                  onChange={handleChange}
                />
                {tp('instructor')}
              </label>
            </div>
          </section>

          {/* Configuration */}
          <section className="bg-white rounded-2xl shadow border border-gray-200">
            <header className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">⚙️ {t('configuration')}</h2>
            </header>
            <div className="px-5 py-6 grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">{t('ad_type')} *</label>
                <select
                  name="adType"
                  value={formData.adType}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="promotion">{tp('promotion')}</option>
                  <option value="event">{tp('event')}</option>
                  <option value="announcement">{tp('announcement')}</option>
                  <option value="internal">{tp('internal')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('priority')} *</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value={0}>{tp('low')} (0)</option>
                  <option value={1}>{tp('medium')} (1)</option>
                  <option value={2}>{tp('high')} (2)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">{t('optional_link')}</label>
                <input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  placeholder={t('link_placeholder')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              {allowBrandingEnabled && (
                <div className="col-span-2 space-y-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="allowBranding"
                      checked={formData.allowBranding}
                      onChange={handleChange}
                    />
                    {t('allow_branding')}
                  </label>
                </div>
              )}
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="px-6 py-3 rounded-xl font-medium text-sm border border-gray-300"
            >
              {t('preview_ad')}
            </button>
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
                  {t('creating')}
                </span>
              ) : (
                <>➕ {t('create_ad')}</>
              )}
            </button>
          </div>
        </form>
      </div>
      {showPreview && (
        <PreviewModal
          ad={{
            title: formData.title,
            description: formData.description,
            image:
              mediaType === 'image' && imagePreview
                ? imagePreview
                : null,
            video: mediaType === 'video' ? videoPreview : null,
            startAt: formData.startAt,
            endAt: formData.endAt,
            targetRoles: formData.targetRoles,
            adType: formData.adType,
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </InstructorLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}

