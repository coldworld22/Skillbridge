// pages/dashboard/admin/settings/contact.js
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import { fetchContactConfig, updateContactConfig } from "@/services/admin/contactConfigService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

const initialConfig = {
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  phone: "+1 555-1234",
  addressLine: "123 Remote Learning Ave",
  city: "EdTech City",
  country: "USA",
  formRecipient: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  mapEmbedUrl: "https://maps.google.com/embed?pb=...",
};

export default function AdminContactSettings() {
  const { t } = useTranslation('dashboard', { keyPrefix: 'contactPage' });
  const [config, setConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchContactConfig();
        if (data) setConfig({ ...initialConfig, ...data });
      } catch (err) {
        toast.error(t('load_failed'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t]);

  const handleChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateContactConfig(config);
      toast.success(t('save_success'));
    } catch (err) {
      toast.error(t('save_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title={t('title')}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-8">📬 {t('title')}</h1>

        <div className="bg-white rounded-xl shadow-md p-6 space-y-6 border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t('public_email')}</label>
              <input
                type="email"
                className="w-full border rounded-lg p-2 focus:ring focus:ring-yellow-200"
                value={config.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t('phone_number')}</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 focus:ring focus:ring-yellow-200"
                value={config.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t('address_line')}</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 focus:ring focus:ring-yellow-200"
                value={config.addressLine}
                onChange={(e) => handleChange('addressLine', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t('city')}</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 focus:ring focus:ring-yellow-200"
                value={config.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t('country')}</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 focus:ring focus:ring-yellow-200"
                value={config.country}
                onChange={(e) => handleChange('country', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t('form_recipient_email')}</label>
              <input
                type="email"
                className="w-full border rounded-lg p-2 focus:ring focus:ring-yellow-200"
                value={config.formRecipient}
                onChange={(e) => handleChange('formRecipient', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t('google_maps_embed_url')}</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 focus:ring focus:ring-yellow-200"
                value={config.mapEmbedUrl}
                onChange={(e) => handleChange('mapEmbedUrl', e.target.value)}
              />
            </div>
          </div>

          <div className="text-right">
            <button
              onClick={handleSave}
              disabled={loading}
              className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg shadow transition ${loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-yellow-600 text-white hover:bg-yellow-700'}`}
            >
              <FaSave /> {loading ? t('saving') : t('save_settings')}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}

