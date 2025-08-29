// pages/admin/ads/edit/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import ImageCropUpload from "@/components/shared/ImageCropUpload";
import { fetchAdById, updateAd } from "@/services/admin/adService";
import { fetchPlanFeatures } from "@/services/planFeatureService";
import { toast } from "react-toastify";
import useAuthStore from "@/store/auth/authStore";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import { FaSpinner, FaTrash, FaImage, FaVideo } from "react-icons/fa";
import PreviewModal from "@/components/admin/ads/PreviewModal";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

export default function EditAdPage() {
  const router = useRouter();
  const { id } = router.query;
  const { t, i18n } = useTranslation('dashboard', { keyPrefix: 'adsEditPage' });
  const { t: tp } = useTranslation('dashboard', { keyPrefix: 'adsPage' });
  const user = useAuthStore((s) => s.user);
  const planKey = user?.plan || 'basic';
  const [planFeatures, setPlanFeatures] = useState(null);
  const { maxAdDuration, allowBranding: allowBrandingEnabled } =
    planFeatures?.[planKey] || {};
  
  const [formData, setFormData] = useState(null);
  const [error, setError] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchPlanFeatures()
      .then(setPlanFeatures)
      .catch(() => setPlanFeatures({}));
  }, []);

  useEffect(() => {
    if (id) {
      fetchAdById(id)
        .then((ad) => {
          if (ad) {
            setFormData(ad);
            if (ad.video) {
              setMediaType('video');
              setVideoPreview(ad.video);
            }
          } else {
            setError(t('not_found'));
            toast.error(t('not_found'));
          }
        })
        .catch(() => {
          setError(t('error_load'));
          toast.error(t('error_load'));
        });
    }
  }, [id, t]);

  useEffect(() => {
    return () => {
      if (videoPreview && videoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

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
    
    if (videoPreview && videoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreview);
    }
    
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleMediaTypeChange = (e) => {
    const type = e.target.value;
    setMediaType(type);
    if (type === 'video' && videoPreview) {
      setFormData(prev => ({ ...prev, image: null }));
    }
  };

  const removeMedia = () => {
    if (mediaType === 'image') {
      setFormData(prev => ({ ...prev, image: null }));
    } else {
      if (videoPreview && videoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(videoPreview);
      }
      setVideoFile(null);
      setVideoPreview('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setUploadProgress(0);
    
    if (!formData) return;

    const start = new Date(formData.startAt);
    const end = new Date(formData.endAt);
    const diffInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (!formData.title || 
        (mediaType === 'image' && !formData.image) || 
        (mediaType === 'video' && !videoFile && !formData.video)) {
      setError(t('required_fields'));
      return;
    }
    
    if (!formData.startAt || !formData.endAt) {
      setError(t('dates_required'));
      return;
    }
    
    if (start > end) {
      setError(t('end_before_start'));
      return;
    }
    
    if (maxAdDuration && diffInDays > maxAdDuration) {
      setError(t('duration_exceeded', { days: maxAdDuration }));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("link_url", formData.link || '');
      payload.append("start_at", formData.startAt);
      payload.append("end_at", formData.endAt);
      payload.append("ad_type", formData.adType);
      payload.append("priority", String(formData.priority));
      payload.append("allow_branding", formData.allowBranding ? "true" : "false");
      payload.append("target_roles", JSON.stringify(formData.targetRoles || []));
      payload.append("is_active", formData.isActive ? "true" : "false");
      payload.append("placement", formData.placement || 'dashboard');

      if (mediaType === 'image' && formData.image instanceof Blob) {
        payload.append('image', formData.image);
      } else if (mediaType === 'video' && videoFile) {
        payload.append('video', videoFile);
      }

      await updateAd(id, payload, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });
      
      toast.success(t('update_success'));
      router.push("/dashboard/admin/ads");
    } catch (err) {
      const message = err?.response?.data?.message || t('update_failed');
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (!formData) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-2xl text-yellow-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6" dir={i18n.dir()}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            ✏️ {t('title')}
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
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 dark:bg-gray-700 dark:text-white"
                  placeholder={t('title_placeholder')}
                />
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
                  {formData.image ? (
                    <div className="relative group">
                      <ImageCropUpload
                        value={typeof formData.image === 'string' ? formData.image : undefined}
                        onChange={(file) => setFormData(prev => ({ ...prev, image: file }))}
                        previewClassName="w-full h-48 object-contain rounded-lg border border-gray-200 dark:border-gray-700 mb-2 bg-gray-100 dark:bg-gray-700"
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
                        <ImageCropUpload
                          onChange={(file) => setFormData(prev => ({ ...prev, image: file }))}
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
                    checked={formData.targetRoles?.includes('student')}
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
                    checked={formData.targetRoles?.includes('instructor')}
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
                  {t('placement')} *
                </label>
                <select
                  name="placement"
                  value={formData.placement}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value="dashboard">{tp('dashboard')}</option>
                  <option value="homepage">{tp('homepage')}</option>
                  <option value="email">{tp('email')}</option>
                  <option value="sidebar">{tp('sidebar')}</option>
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
              <div className="col-span-2">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="text-yellow-600 dark:text-yellow-400 focus:ring-yellow-500 dark:focus:ring-yellow-400"
                  />
                  <span className="text-sm">{t('activate_ad')}</span>
                </label>
              </div>
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
              disabled={!formData.title || (!formData.image && !videoPreview)}
              className={`px-6 py-3 rounded-xl font-medium text-sm border transition-colors ${
                !formData.title || (!formData.image && !videoPreview)
                  ? "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  : "border-yellow-500 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-gray-700"
              }`}
            >
              {t('preview_ad')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-xl font-medium text-white text-sm transition-all flex items-center justify-center gap-2 ${
                isSubmitting
                  ? "bg-yellow-400 dark:bg-yellow-500/50 cursor-not-allowed"
                  : "bg-yellow-600 dark:bg-yellow-500 hover:bg-yellow-700 dark:hover:bg-yellow-600"
              }`}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  {uploadProgress > 0 ? `${uploadProgress}%` : t('updating')}
                </>
              ) : (
                <>💾 {t('save_changes')}</>
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
            image: mediaType === 'image' ? (typeof formData.image === 'string' ? formData.image : null) : null,
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

export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' };
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}