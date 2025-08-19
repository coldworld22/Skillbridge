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

const defaultConfig = { 
  appName: "", 
  siteTitle: "", 
  logo_url: "",
  favicon_url: "",
  home_bg_url: "",
  metaDescription: "",
  contactEmail: ""
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
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 space-y-6" dir={i18n.dir()}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('title')}</h1>
          <button
            type="submit"
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              isLoading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-yellow-600 hover:bg-yellow-700 text-white"
            }`}
          >
            <FaSave />
            {isLoading ? t('saving') : t('save')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Settings Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <FaGlobe /> {t('basic_settings')}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('application_name_label')} *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                  value={config.appName}
                  onChange={(e) => handleChange("appName", e.target.value)}
                  placeholder={t('app_name_placeholder')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('site_title_label')} *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                  value={config.siteTitle}
                  onChange={(e) => handleChange("siteTitle", e.target.value)}
                  placeholder={t('site_title_placeholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('contact_email_label')}
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                  value={config.contactEmail || ""}
                  onChange={(e) => handleChange("contactEmail", e.target.value)}
                  placeholder={t('contact_email_placeholder')}
                />
              </div>

            </div>
          </div>

          {/* Media Settings Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <FaImage /> {t('media_settings')}
            </h2>
            
            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('application_logo')}
                </label>
                
                {(config.logo_url || logoPreview) && (
                  <div className="mb-3 flex items-center gap-4">
                    <img
                      src={
                        logoPreview ||
                        (config.logo_url ? `${API_BASE_URL}${config.logo_url}` : "")
                      }
                      alt="Logo preview"
                      className="h-16 object-contain border border-gray-200 dark:border-gray-600 rounded"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {t('recommended_logo')}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <label className="flex-1">
                    <div className="flex items-center justify-center w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      <FaUpload className="mr-2" />
                      {logoFile ? logoFile.name : t('choose_file')}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setLogoFile(e.target.files[0])}
                    />
                  </label>

                  {logoFile && (
                    <button
                      type="button"
                      onClick={handleLogoUpload}
                      disabled={isLoading}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {t('upload')}
                    </button>
                  )}
                </div>
              </div>

              {/* Favicon Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('favicon')}
                </label>
                
                {(config.favicon_url || faviconPreview) && (
                  <div className="mb-3 flex items-center gap-4">
                    <img
                      src={
                        faviconPreview ||
                        (config.favicon_url
                          ? `${API_BASE_URL}${config.favicon_url}`
                          : "")
                      }
                      alt="Favicon preview"
                      className="h-10 w-10 object-contain border border-gray-200 dark:border-gray-600 rounded"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {t('recommended_favicon')}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <label className="flex-1">
                    <div className="flex items-center justify-center w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      <FaUpload className="mr-2" />
                      {faviconFile ? faviconFile.name : t('choose_file')}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFaviconFile(e.target.files[0])}
                    />
                  </label>

              {faviconFile && (
                <button
                  type="button"
                  onClick={handleFaviconUpload}
                  disabled={isLoading}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {t('upload')}
                </button>
              )}
            </div>
          </div>

          {/* Home Background Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('home_background')}
            </label>

            {(config.home_bg_url || homeBgPreview) && (
              <div className="mb-3 flex items-center gap-4">
                <img
                  src={
                    homeBgPreview ||
                    (config.home_bg_url ? `${API_BASE_URL}${config.home_bg_url}` : "")
                  }
                  alt="Background preview"
                  className="h-24 w-full object-cover border border-gray-200 dark:border-gray-600 rounded"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('recommended_home_bg')}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <label className="flex-1">
                <div className="flex items-center justify-center w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <FaUpload className="mr-2" />
                  {homeBgFile ? homeBgFile.name : t('choose_file')}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setHomeBgFile(e.target.files[0])}
                />
              </label>

              {homeBgFile && (
                <button
                  type="button"
                  onClick={handleHomeBgUpload}
                  disabled={isLoading}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
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

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}