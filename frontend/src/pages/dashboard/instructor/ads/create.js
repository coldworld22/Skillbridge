// pages/admin/ads/create.js
import { useState } from "react";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "@/components/layouts/AdminLayout";
import ImageCropUpload from "@/components/shared/ImageCropUpload";
import PlanLimitHint from "@/components/shared/PlanLimitHint";
import plansConfig from "@/config/plansConfig";
import { createAd } from "@/services/admin/adService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

const currentUserPlan = "basic"; // "basic" | "regular" | "prime"
const { maxAdDuration } = plansConfig[currentUserPlan];

export default function CreateAdPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation('dashboard', { keyPrefix: 'adsCreatePage' });
  const { t: tp } = useTranslation('dashboard', { keyPrefix: 'adsPage' });
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
    if (!formData.title || !formData.image) {
      setError(t('title_image_required'));
      return;
    }

    try {
      const payload = new FormData();
      const file =
        formData.image instanceof File
          ? formData.image
          : new File([formData.image], "ad.jpg", { type: formData.image.type || "image/jpeg" });
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("link_url", formData.link);
      payload.append("image", file);

      await createAd(payload);
      toast.success(t('success'));
      router.push("/dashboard/instructor/ads");
    } catch (err) {
      const message = err?.response?.data?.message || t('failed');
      if (message.toLowerCase().includes("title")) {
        setTitleError(t('title_exists'));
      } else {
        setError(message);
        toast.error(message);
      }
    }
  };

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <div className="max-w-3xl mx-auto p-6" dir={i18n.dir()}>
        <h1 className="text-3xl font-bold mb-6">📢 {t('title')}</h1>
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">🎯 {t('ad_details')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium">{t('title_label')} *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={(e) => {
                    setTitleError(null);
                    handleChange(e);
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-blue-500"
                />
                {titleError && (
                  <p className="text-red-600 text-sm mt-1">{titleError}</p>
                )}
              </div>
              <div>
                <label className="block font-medium">{t('description_label')}</label>
                <textarea name="description" value={formData.description} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2" rows={3} />
              </div>
              <div>
                <label className="block font-medium">{t('image_label')} *</label>
                <ImageCropUpload
                  onChange={(file) => setFormData((prev) => ({ ...prev, image: file }))}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">📅 {t('schedule')}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium">{t('start_date')} *</label>
                <input type="date" name="startAt" value={formData.startAt} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block font-medium">{t('end_date')} *</label>
                <input type="date" name="endAt" value={formData.endAt} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2" />
              </div>
            </div>
            <PlanLimitHint plan={currentUserPlan} />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">⚙️ {t('configuration')}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium">{t('ad_type')} *</label>
                <select name="adType" value={formData.adType} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2">
                  <option value="promotion">{tp('promotion')}</option>
                  <option value="event">{tp('event')}</option>
                  <option value="announcement">{tp('announcement')}</option>
                  <option value="internal">{tp('internal')}</option>
                </select>
              </div>

              <div>
                <label className="block font-medium">{t('priority')} *</label>
                <select name="priority" value={formData.priority} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2">
                  <option value={0}>{tp('low')} (0)</option>
                  <option value={1}>{tp('medium')} (1)</option>
                  <option value={2}>{tp('high')} (2)</option>
                </select>
              </div>
              <div>
                <label className="block font-medium">{t('optional_link')}</label>
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
              <span className="text-sm">{t('allow_branding')}</span>
            </label>
          </section>

          <button type="submit"
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-6 py-2 rounded transition">
            ➕ {t('create_ad')}
          </button>
        </form>
      </div>
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