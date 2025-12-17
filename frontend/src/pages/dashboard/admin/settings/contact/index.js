// pages/dashboard/admin/settings/contact.js
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import { fetchContactConfig, updateContactConfig } from "@/services/admin/contactConfigService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import styles from "../settings.module.scss";

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
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>📬 {t('title')}</h1>
        </div>

        <div className={styles.card}>
          <div className={styles.gridTwo}>
            <div className={styles.field}>
              <label className={styles.label}>{t('public_email')}</label>
              <input
                type="email"
                className={styles.input}
                value={config.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('phone_number')}</label>
              <input
                type="text"
                className={styles.input}
                value={config.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('address_line')}</label>
              <input
                type="text"
                className={styles.input}
                value={config.addressLine}
                onChange={(e) => handleChange('addressLine', e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('city')}</label>
              <input
                type="text"
                className={styles.input}
                value={config.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('country')}</label>
              <input
                type="text"
                className={styles.input}
                value={config.country}
                onChange={(e) => handleChange('country', e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('form_recipient_email')}</label>
              <input
                type="email"
                className={styles.input}
                value={config.formRecipient}
                onChange={(e) => handleChange('formRecipient', e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('google_maps_embed_url')}</label>
              <input
                type="text"
                className={styles.input}
                value={config.mapEmbedUrl}
                onChange={(e) => handleChange('mapEmbedUrl', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.actionsRight}>
            <button
              onClick={handleSave}
              disabled={loading}
              className={styles.buttonPrimary}
            >
              <FaSave /> {loading ? t('saving') : t('save_settings')}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
