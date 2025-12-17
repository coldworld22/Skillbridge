import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  fetchAppConfig,
  updateAppConfig,
  uploadAppLogo,
  uploadAppFavicon,
  uploadHomeBackground,
} from "@/services/admin/appConfigService";
import useAppConfigStore from "@/store/appConfigStore";
import { FaSave, FaUpload, FaImage, FaGlobe } from "react-icons/fa";
import { toast } from "react-toastify";
import { API_BASE_URL } from "@/config/config";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import styles from "../settings.module.scss";

const defaultConfig = {
  appName: "",
  siteTitle: "",
  logo_url: "",
  favicon_url: "",
  home_bg_url: "",
  metaDescription: "",
  contactEmail: "",
};

export default function AppSettingsPage() {
  const [config, setConfig] = useState(defaultConfig);
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [homeBgFile, setHomeBgFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");
  const [faviconPreview, setFaviconPreview] = useState("");
  const [homeBgPreview, setHomeBgPreview] = useState("");
  const updateConfigStore = useAppConfigStore((state) => state.update);
  const { t, i18n } = useTranslation('dashboard', { keyPrefix: 'appSettingsPage' });

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAppConfig();
        if (data) {
          setConfig({ ...defaultConfig, ...data });
          updateConfigStore(data);
        }
      } catch (err) {
        console.error("Failed to load app settings", err);
        toast.error(t('load_failed'));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [logoFile]);

  useEffect(() => {
    if (!faviconFile) {
      setFaviconPreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(faviconFile);
    setFaviconPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [faviconFile]);

  useEffect(() => {
    if (!homeBgFile) {
      setHomeBgPreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(homeBgFile);
    setHomeBgPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [homeBgFile]);

  const handleChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleSave();
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updated = await updateAppConfig(config);
      updateConfigStore(updated);
      toast.success(t('save_success'));
    } catch (err) {
      console.error("Failed to save settings", err);
      toast.error(t('save_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setIsLoading(true);
    try {
      const data = await uploadAppLogo(logoFile);
      setConfig((prev) => ({ ...prev, ...data }));
      updateConfigStore(data);
      setLogoFile(null);
      toast.success(t('logo_upload_success'));
    } catch (err) {
      toast.error(t('logo_upload_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaviconUpload = async () => {
    if (!faviconFile) return;
    setIsLoading(true);
    try {
      const data = await uploadAppFavicon(faviconFile);
      setConfig((prev) => ({ ...prev, ...data }));
      updateConfigStore(data);
      setFaviconFile(null);
      toast.success(t('favicon_upload_success'));
    } catch (err) {
      toast.error(t('favicon_upload_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleHomeBgUpload = async () => {
    if (!homeBgFile) return;
    setIsLoading(true);
    try {
      const data = await uploadHomeBackground(homeBgFile);
      setConfig((prev) => ({ ...prev, ...data }));
      updateConfigStore(data);
      setHomeBgFile(null);
      toast.success(t('background_upload_success'));
    } catch (err) {
      toast.error(t('background_upload_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout title={t('title')}>
      <form onSubmit={handleSubmit} className={styles.page} dir={i18n.dir()}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('title')}</h1>
          <button
            type="submit"
            disabled={isLoading}
            className={styles.buttonPrimary}
          >
            <FaSave />
            {isLoading ? t('saving') : t('save')}
          </button>
        </div>

        <div className={styles.gridTwo}>
          {/* Basic Settings Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FaGlobe /> {t('basic_settings')}
            </h2>

            <div className={styles.stack}>
              <div className={styles.field}>
                <label className={styles.label}>
                  {t('application_name_label')} *
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={config.appName}
                  onChange={(e) => handleChange("appName", e.target.value)}
                  placeholder={t('app_name_placeholder')}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  {t('site_title_label')} *
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={config.siteTitle}
                  onChange={(e) => handleChange("siteTitle", e.target.value)}
                  placeholder={t('site_title_placeholder')}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  {t('contact_email_label')}
                </label>
                <input
                  type="email"
                  className={styles.input}
                  value={config.contactEmail || ""}
                  onChange={(e) => handleChange("contactEmail", e.target.value)}
                  placeholder={t('contact_email_placeholder')}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>{t('meta_description_label')}</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={config.metaDescription || ""}
                  onChange={(e) => handleChange("metaDescription", e.target.value)}
                  placeholder={t('meta_description_placeholder')}
                />
              </div>
            </div>
          </div>

          {/* Media Settings Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FaImage /> {t('media_settings')}
            </h2>

            <div className={styles.stack}>
              {/* Logo Upload */}
              <div className={styles.field}>
                <label className={styles.label}>{t('application_logo')}</label>
                {(config.logo_url || logoPreview) && (
                  <div className={styles.inlineCard} style={{ alignItems: "center" }}>
                    <img
                      src={
                        logoPreview ||
                        (config.logo_url ? `${API_BASE_URL}${config.logo_url}` : "")
                      }
                      alt="Logo preview"
                      className={styles.previewImage}
                    />
                    <span className={styles.mutedText}>{t('recommended_logo')}</span>
                  </div>
                )}
                <div className={styles.inlineCard} style={{ alignItems: "center" }}>
                  <label className={styles.buttonSecondary} style={{ width: "100%", justifyContent: "center" }}>
                    <FaUpload /> {logoFile ? logoFile.name : t('choose_file')}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => setLogoFile(e.target.files[0])}
                    />
                  </label>
                  {logoFile && (
                    <button
                      type="button"
                      onClick={handleLogoUpload}
                      disabled={isLoading}
                      className={styles.buttonPrimary}
                    >
                      {t('upload')}
                    </button>
                  )}
                </div>
              </div>

              {/* Favicon Upload */}
              <div className={styles.field}>
                <label className={styles.label}>{t('favicon')}</label>
                {(config.favicon_url || faviconPreview) && (
                  <div className={styles.inlineCard} style={{ alignItems: "center" }}>
                    <img
                      src={
                        faviconPreview ||
                        (config.favicon_url ? `${API_BASE_URL}${config.favicon_url}` : "")
                      }
                      alt="Favicon preview"
                      className={styles.previewImage}
                    />
                    <span className={styles.mutedText}>{t('recommended_favicon')}</span>
                  </div>
                )}
                <div className={styles.inlineCard} style={{ alignItems: "center" }}>
                  <label className={styles.buttonSecondary} style={{ width: "100%", justifyContent: "center" }}>
                    <FaUpload /> {faviconFile ? faviconFile.name : t('choose_file')}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => setFaviconFile(e.target.files[0])}
                    />
                  </label>
                  {faviconFile && (
                    <button
                      type="button"
                      onClick={handleFaviconUpload}
                      disabled={isLoading}
                      className={styles.buttonPrimary}
                    >
                      {t('upload')}
                    </button>
                  )}
                </div>
              </div>

              {/* Home Background Upload */}
              <div className={styles.field}>
                <label className={styles.label}>{t('home_background')}</label>

                {(config.home_bg_url || homeBgPreview) && (
                  <div className={styles.inlineCard} style={{ alignItems: "center" }}>
                    <img
                      src={
                        homeBgPreview ||
                        (config.home_bg_url ? `${API_BASE_URL}${config.home_bg_url}` : "")
                      }
                      alt="Background preview"
                      className={styles.previewImage}
                      style={{ width: "100%", height: "auto" }}
                    />
                    <span className={styles.mutedText}>{t('recommended_home_bg')}</span>
                  </div>
                )}

                <div className={styles.inlineCard} style={{ alignItems: "center" }}>
                  <label className={styles.buttonSecondary} style={{ width: "100%", justifyContent: "center" }}>
                    <FaUpload /> {homeBgFile ? homeBgFile.name : t('choose_file')}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => setHomeBgFile(e.target.files[0])}
                    />
                  </label>

                  {homeBgFile && (
                    <button
                      type="button"
                      onClick={handleHomeBgUpload}
                      disabled={isLoading}
                      className={styles.buttonPrimary}
                    >
                      {t('upload')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
