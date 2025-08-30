// pages/dashboard/instructor/ads/edit/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import ImageCropUpload from "@/components/shared/ImageCropUpload";
import { fetchAdById, updateAd } from "@/services/admin/adService";
import { fetchPlanFeatures } from "@/services/planFeatureService";
import { toast } from "react-toastify";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import { FiSave, FiCalendar, FiLink, FiType, FiInfo } from "react-icons/fi";
import { IoMdAlert } from "react-icons/io";
import { ImSpinner8 } from "react-icons/im";
import { FaVideo, FaImage, FaTrash } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

export default function EditAdPage() {
  const router = useRouter();
  const { id } = router.query;
  const { t, i18n } = useTranslation('dashboard', { keyPrefix: 'adsEditPage' });
  const { t: tp } = useTranslation('dashboard', { keyPrefix: 'adsPage' });
  const user = useAuthStore((s) => s.user);
  const planKey = user?.plan || 'basic';
  const [planFeatures, setPlanFeatures] = useState(null);
  const { maxAdDuration } = planFeatures?.[planKey] || {};
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const refreshNotifications = useNotificationStore((s) => s.fetch);
  const refreshMessages = useMessageStore((s) => s.fetch);
  const [mediaType, setMediaType] = useState('image');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');

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
    fetchPlanFeatures('ads')
      .then(setPlanFeatures)
      .catch(() => setPlanFeatures({}));
  }, []);

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
            if (ad.video) {
              setMediaType('video');
              setVideoPreview(ad.video);
            }
          } else {
            setError(t('not_found'));
            toast.error(t('not_found'));
            router.push("/dashboard/instructor/ads");
          }
        })
        .catch((err) => {
          setError(t('error_load'));
          toast.error(t('error_load'));
          console.error("[EditAdPage] fetch error:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [id, t, router]);

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
    if (type === 'image') {
      if (videoPreview && videoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(videoPreview);
      }
      setVideoFile(null);
      setVideoPreview('');
    } else {
      setFormData((prev) => ({ ...prev, image: null }));
    }
  };

  const removeMedia = () => {
    if (mediaType === 'image') {
      setFormData((prev) => ({ ...prev, image: null }));
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
    setSubmitting(true);
    setError(null);

    const start = new Date(formData.startAt);
    const end = new Date(formData.endAt);
    const diffInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (
      !formData.title ||
      (mediaType === 'image' && !formData.image) ||
      (mediaType === 'video' && !videoFile && !formData.video) ||
      !formData.startAt ||
      !formData.endAt
    ) {
      setError(t('required_fields'));
      setSubmitting(false);
      return;
    }
    if (start > end) {
      setError(t('end_before_start'));
      setSubmitting(false);
      return;
    }
    if (diffInDays > maxAdDuration) {
      setError(t('duration_exceeded', { days: maxAdDuration }));
      setSubmitting(false);
      return;
    }

    try {
      const payload = new FormData();
      if (mediaType === 'image' && formData.image instanceof Blob) {
        const file =
          formData.image instanceof File
            ? formData.image
            : new File([formData.image], 'ad.jpg', {
                type: formData.image.type || 'image/jpeg',
              });
        payload.append('image', file);
      } else if (mediaType === 'video' && videoFile) {
        payload.append('video', videoFile);
      }
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      payload.append('link_url', formData.link);
      payload.append('adType', formData.adType);
      payload.append('placement', formData.placement);
      payload.append('priority', formData.priority);
      payload.append('allowBranding', formData.allowBranding);
      payload.append('startAt', new Date(formData.startAt).toISOString());
      payload.append('endAt', new Date(formData.endAt).toISOString());

      await updateAd(id, payload);
      toast.success(t('update_success'), { autoClose: 2000 });
      await notify('ad_updated', t('ad_created_notification', { title: formData.title }));
      setTimeout(() => router.push('/dashboard/instructor/ads'), 1500);
    } catch (err) {
      console.error('[EditAdPage] update error:', err);
      setError(err.response?.data?.message || t('update_failed'));
      toast.error(t('update_failed'));
    } finally {
      setSubmitting(false);
    }
  };

    if (loading) {
      return (
        <InstructorLayout>
          <div className="flex items-center justify-center min-h-[60vh]" dir={i18n.dir()}>
            <div className="flex flex-col items-center gap-4">
              <ImSpinner8 className="animate-spin text-3xl text-blue-600" />
              <p className="text-gray-600">{t('loading')}</p>
            </div>
          </div>
        </InstructorLayout>
      );
    }

  return (
    <InstructorLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6" dir={i18n.dir()}>
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <FiType className="text-blue-600" />
              {t('title')}
            </h1>
            <p className="text-gray-600 mt-1">{t('description')}</p>
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
                {t('ad_details')}
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('title_label')} *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                    placeholder={t('title_placeholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('description_label')}</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition min-h-[120px]"
                    placeholder={t('description_placeholder')}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        className="text-blue-600 focus:ring-blue-500"
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
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="flex items-center gap-1 text-sm">
                        <FaVideo /> {t('video')}
                      </span>
                    </label>
                  </div>
                </div>

                {mediaType === 'image' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <FaImage />
                      {t('image_label')} *
                    </label>
                    <ImageCropUpload
                      value={typeof formData.image === 'string' ? formData.image : undefined}
                      onChange={(file) => setFormData((prev) => ({ ...prev, image: file }))}
                      aspectRatio={16 / 9}
                      className="border-2 border-dashed border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('image_requirements')}</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('video_label')} *
                    </label>
                    {videoPreview ? (
                      <div className="relative group">
                        <video
                          src={videoPreview}
                          className="w-full h-48 rounded-lg border border-gray-300 mb-2 bg-black"
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
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FaVideo className="w-8 h-8 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">{t('click_to_upload')}</span>
                            </p>
                            <p className="text-xs text-gray-500">{t('video_requirements')}</p>
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

            <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiCalendar className="text-blue-600" />
                {t('schedule')}
              </h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('start_date')} *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('end_date')} *</label>
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
                {t('duration_preview', {
                  days: Math.ceil(
                    (new Date(formData.endAt) - new Date(formData.startAt)) /
                      (1000 * 60 * 60 * 24)
                  ),
                  max: maxAdDuration,
                })}
              </p>
              )}
            </section>

            <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('configuration')}</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('ad_type')}</label>
                  <select
                    name="adType"
                    value={formData.adType}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                  >
                    <option value="promotion">{tp('promotion')}</option>
                    <option value="event">{tp('event')}</option>
                    <option value="announcement">{tp('announcement')}</option>
                    <option value="internal">{tp('internal')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('placement')}</label>
                  <select
                    name="placement"
                    value={formData.placement}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                  >
                    <option value="dashboard">{tp('dashboard')}</option>
                    <option value="homepage">{tp('homepage')}</option>
                    <option value="email">{tp('email')}</option>
                    <option value="sidebar">{tp('sidebar')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('priority')}</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                  >
                    <option value={0}>{tp('low')} (0)</option>
                    <option value={1}>{tp('medium')} (1)</option>
                    <option value={2}>{tp('high')} (2)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <FiLink />
                    {t('optional_link')}
                  </label>
                  <input
                    type="url"
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    placeholder={t('link_placeholder')}
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
                  {t('allow_branding')}
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
                {t('back_to_ads')}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70"
                disabled={submitting}
              >
                {submitting ? (
                <>
                  <ImSpinner8 className="animate-spin" />
                  {t('updating')}
                </>
                ) : (
                <>
                  <FiSave />
                  {t('save_changes')}
                </>
                )}
              </button>
            </div>
        </form>
      </div>
    </InstructorLayout>
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