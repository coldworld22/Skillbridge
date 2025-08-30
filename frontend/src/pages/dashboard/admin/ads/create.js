// pages/admin/ads/create.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import AdminLayout from "@/components/layouts/AdminLayout";
import { createAd, checkAdTitle } from "@/services/admin/adService";
import { fetchPlanFeatures } from "@/services/planFeatureService";
import { FaSpinner, FaTrash, FaImage, FaVideo } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import useAuthStore from "@/store/auth/authStore";
import PreviewModal from "@/components/admin/ads/PreviewModal";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

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
  const [planFeatures, setPlanFeatures] = useState(null);
  const { allowBranding: allowBrandingEnabled } =
    planFeatures?.[planKey] || { allowBranding: false };
  
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
  const [isCheckingTitle, setIsCheckingTitle] = useState(false);
  const [mediaType, setMediaType] = useState('image');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchPlanFeatures('ads')
      .then(setPlanFeatures)
      .catch(() => setPlanFeatures({}));
  }, []);

  const isFormValid =
    formData.title &&
    formData.startAt &&
    formData.endAt &&
    ((mediaType === 'image' && formData.image) || (mediaType === 'video' && videoFile));
  const disableSubmit = !isFormValid || isSubmitting || isCheckingTitle || titleError;

  useEffect(() => {
    if (!formData.title) {
      setTitleError(null);
      setIsCheckingTitle(false);
      return;
    }
    
    setIsCheckingTitle(true);
    const timeout = setTimeout(async () => {
      try {
        const exists = await checkAdTitle(formData.title);
        setTitleError(exists ? t('title_exists') : null);
      } catch {
        /* ignore */
      } finally {
        setIsCheckingTitle(false);
      }
    }, 500);
    
    return () => {
      clearTimeout(timeout);
      setIsCheckingTitle(false);
    };
  }, [formData.title, t]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(t('invalid_image_type'));
      return;
    }
    
    if (file.size > MAX_IMAGE_SIZE) {
      setError(t('image_too_large', { size: '5MB' }));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setError(null);
      setFormData((prev) => ({ ...prev, image: file }));
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

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

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setError(t('invalid_video_type'));
      return;
    }
    
    if (file.size > MAX_VIDEO_SIZE) {
      setError(t('video_too_large', { size: '50MB' }));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      setVideoFile(file);
      setVideoPreview(e.target.result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleMediaTypeChange = (e) => {
    const type = e.target.value;
    setMediaType(type);
    if (type === 'image') {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      setVideoFile(null);
      setVideoPreview('');
    } else {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setFormData((prev) => ({ ...prev, image: null }));
      setImagePreview('');
    }
  };

  const removeMedia = () => {
    if (mediaType === 'image') {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setFormData((prev) => ({ ...prev, image: null }));
      setImagePreview('');
    } else {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      setVideoFile(null);
      setVideoPreview('');
    }
  };

  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [videoPreview, imagePreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setUploadProgress(0);

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
    
    if (titleError || isCheckingTitle) return;

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

      await createAd(payload, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });
      
      toast.success(t('success'));
      const msg = t('ad_created_notification', { title: formData.title });
      await notify('ad_created', msg);
      router.push("/dashboard/admin/ads");
    } catch (err) {
      const data = err?.response?.data || {};
      const baseMessage = data.message || t('failed');
      if (data.errors?.length) {
        const details = data.errors
          .map((e) => {
            const path = Array.isArray(e.path) ? e.path.join('.') : '';
            return path ? `${path}: ${e.message}` : e.message;
          })
          .join(', ');
        setError(details);
        toast.error(details);
      } else if (baseMessage.toLowerCase().includes('title')) {
        setTitleError(t('title_exists'));
      } else {
        setError(baseMessage);
        toast.error(baseMessage);
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6" dir={i18n.dir()}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            🛠️ {t('title')}
          </h1>
          <button
            onClick={() => router.push("/dashboard/admin/ads")}
            className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            {t('back_to_ads')}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ad Details */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200">
                🎯 {t('ad_details')}
              </h2>
            </header>
            <div className="px-5 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  {t('title_label')} *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={(e) => {
                      setTitleError(null);
                      handleChange(e);
                    }}
                    className={`w-full border px-3 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      titleError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder={t('title_placeholder')}
                  />
                  {isCheckingTitle && <FaSpinner className="animate-spin text-gray-400" />}
                </div>
                {titleError && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{titleError}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  {t('description_label')}
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                  placeholder={t('description_placeholder')}
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('media_type')} *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mediaType"
                      value="image"
                      checked={mediaType === 'image'}
                      onChange={handleMediaTypeChange}
                      className="text-yellow-600 dark:text-yellow-400 focus:ring-yellow-500 dark:focus:ring-yellow-400"
                    />
                    <span className="flex items-center gap-1 text-sm">
                      <FaImage /> {t('image')}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mediaType"
                      value="video"
                      checked={mediaType === 'video'}
                      onChange={handleMediaTypeChange}
                      className="text-yellow-600 dark:text-yellow-400 focus:ring-yellow-500 dark:focus:ring-yellow-400"
                    />
                    <span className="flex items-center gap-1 text-sm">
                      <FaVideo /> {t('video')}
                    </span>
                  </label>
                </div>
              </div>
              
              {mediaType === 'image' ? (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    {t('image_label')} *
                  </label>
                  {imagePreview ? (
                    <div className="relative group">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-contain rounded-lg border border-gray-200 dark:border-gray-700 mb-2 bg-gray-100 dark:bg-gray-700"
                      />
                      <button
                        type="button"
                        onClick={removeMedia}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t('remove_image')}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FaImage className="w-8 h-8 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">{t('click_to_upload')}</span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('image_requirements')}
                          </p>
                        </div>
                        <input
                          type="file"
                          accept={ALLOWED_IMAGE_TYPES.join(',')}
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    {t('video_label')} *
                  </label>
                  {videoPreview ? (
                    <div className="relative group">
                      <video
                        src={videoPreview}
                        className="w-full h-48 rounded-lg border border-gray-200 dark:border-gray-700 mb-2 bg-black"
                        controls
                      />
                      <button
                        type="button"
                        onClick={removeMedia}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t('remove_video')}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FaVideo className="w-8 h-8 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">{t('click_to_upload')}</span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('video_requirements')}
                          </p>
                        </div>
                        <input
                          type="file"
                          accept={ALLOWED_VIDEO_TYPES.join(',')}
                          onChange={handleVideoChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Schedule */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200">
                📅 {t('schedule')}
              </h2>
            </header>
            <div className="px-5 py-6 grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  {t('start_date')} *
                </label>
                <input
                  type="datetime-local"
                  name="startAt"
                  value={formData.startAt}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  {t('end_date')} *
                </label>
                <input
                  type="datetime-local"
                  name="endAt"
                  value={formData.endAt}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                  min={formData.startAt || new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>
          </section>

          {/* Target Audience */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200">
                👥 {t('target_audience')}
              </h2>
            </header>
            <div className="px-5 py-6 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {t('target_audience_help')}
              </p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <input
                    type="checkbox"
                    name="targetRoles"
                    value="student"
                    checked={formData.targetRoles.includes('student')}
                    onChange={handleChange}
                    className="text-yellow-600 dark:text-yellow-400 focus:ring-yellow-500 dark:focus:ring-yellow-400"
                  />
                  <span className="text-sm">{tp('student')}</span>
                </label>
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <input
                    type="checkbox"
                    name="targetRoles"
                    value="instructor"
                    checked={formData.targetRoles.includes('instructor')}
                    onChange={handleChange}
                    className="text-yellow-600 dark:text-yellow-400 focus:ring-yellow-500 dark:focus:ring-yellow-400"
                  />
                  <span className="text-sm">{tp('instructor')}</span>
                </label>
              </div>
            </div>
          </section>

          {/* Configuration */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200">
                ⚙️ {t('configuration')}
              </h2>
            </header>
            <div className="px-5 py-6 grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  {t('ad_type')} *
                </label>
                <select
                  name="adType"
                  value={formData.adType}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value="promotion">{tp('promotion')}</option>
                  <option value="event">{tp('event')}</option>
                  <option value="announcement">{tp('announcement')}</option>
                  <option value="internal">{tp('internal')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  {t('priority')} *
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value={0}>{tp('low')} (0)</option>
                  <option value={1}>{tp('medium')} (1)</option>
                  <option value={2}>{tp('high')} (2)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  {t('optional_link')}
                </label>
                <input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  placeholder={t('link_placeholder')}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
              {allowBrandingEnabled && (
                <div className="col-span-2">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <input
                      type="checkbox"
                      name="allowBranding"
                      checked={formData.allowBranding}
                      onChange={handleChange}
                      className="text-yellow-600 dark:text-yellow-400 focus:ring-yellow-500 dark:focus:ring-yellow-400"
                    />
                    <span className="text-sm">{t('allow_branding')}</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {t('allow_branding_help')}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Progress Bar */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-yellow-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              disabled={!isFormValid}
              className={`px-6 py-3 rounded-xl font-medium text-sm border transition-colors ${
                !isFormValid
                  ? "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  : "border-yellow-500 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-gray-700"
              }`}
            >
              {t('preview_ad')}
            </button>
            <button
              type="submit"
              disabled={disableSubmit}
              className={`px-6 py-3 rounded-xl font-medium text-white text-sm transition-all flex items-center justify-center gap-2 ${
                disableSubmit
                  ? "bg-yellow-400 dark:bg-yellow-500/50 cursor-not-allowed"
                  : "bg-yellow-600 dark:bg-yellow-500 hover:bg-yellow-700 dark:hover:bg-yellow-600"
              }`}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  {uploadProgress > 0 ? `${uploadProgress}%` : t('creating')}
                </>
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
            image: mediaType === 'image' ? imagePreview : null,
            video: mediaType === 'video' ? videoPreview : null,
            startAt: formData.startAt,
            endAt: formData.endAt,
            targetRoles: formData.targetRoles,
            adType: formData.adType,
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </AdminLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}