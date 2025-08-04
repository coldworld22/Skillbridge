// pages/admin/ads/edit/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import ImageCropUpload from "@/components/shared/ImageCropUpload";
import plansConfig from "@/config/plansConfig";
import { fetchAdById, updateAd } from "@/services/admin/adService";
import { toast } from "react-toastify";
import useAuthStore from "@/store/auth/authStore";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

export default function EditAdPage() {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation('dashboard', { keyPrefix: 'adsEditPage' });
  const user = useAuthStore((s) => s.user);
  const currentUserPlan = user?.plan || 'basic';
  const { maxAdDuration } = plansConfig[currentUserPlan] || {};
  const [formData, setFormData] = useState(null);
  const [error, setError] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');

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
          } else setError(t('not_found'));
        })
        .catch(() => setError(t('error_load')));
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
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const start = new Date(formData.startAt);
    const end = new Date(formData.endAt);
    const diffInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (!formData.title || (mediaType === 'image' && !formData.image) || (mediaType === 'video' && !videoFile && !formData.video) || !formData.startAt || !formData.endAt) {
      setError(t('required_fields'));
      return;
    }
    if (start > end) {
      setError(t('end_before_start'));
      return;
    }
    if (diffInDays > maxAdDuration) {
      setError(t('duration_exceeded', { days: maxAdDuration }));
      return;
    }

    try {
      const payload = new FormData();
      if (mediaType === 'image') {
        if (formData.image instanceof Blob) {
          const file =
            formData.image instanceof File
              ? formData.image
              : new File([formData.image], "ad.jpg", { type: formData.image.type || "image/jpeg" });
          payload.append("image", file);
        }
      } else if (mediaType === 'video') {
        if (videoFile) payload.append('video', videoFile);
      }
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("link_url", formData.link);

      await updateAd(id, payload);
      toast.success(t('update_success'));
      router.push("/dashboard/admin/ads");
    } catch (err) {
      setError(t('update_failed'));
      toast.error(t('update_failed'));
    }
  };

  if (!formData) {
    return (
      <AdminLayout>
        <div className="p-6">{t('loading')}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
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
              <div className="space-y-2">
                <label className="block text-sm font-medium">Media Type</label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              {mediaType === 'image' ? (
                <ImageCropUpload
                  value={typeof formData.image === 'string' ? formData.image : undefined}
                  onChange={(file) => setFormData((prev) => ({ ...prev, image: file }))}
                />
              ) : (
                <div>
                  {videoPreview && (
                    <video src={videoPreview} className="h-40 w-full mb-2" controls />
                  )}
                  <input type="file" accept="video/*" onChange={handleVideoChange} />
                </div>
              )}
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
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />
              <span className="text-sm">Activate this ad</span>
            </label>
          </section>

          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            💾 Save Changes
          </button>
        </form>
      </div>
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
