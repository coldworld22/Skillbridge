import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { fetchAppConfig, updateAppConfig, uploadAppLogo, uploadAppFavicon } from "@/services/admin/appConfigService";
import { FaSave, FaUpload, FaImage, FaGlobe } from "react-icons/fa";
import { toast } from "react-toastify";

const defaultConfig = { 
  appName: "", 
  siteTitle: "", 
  logo_url: "", 
  favicon_url: "",
  metaDescription: "",
  contactEmail: ""
};

export default function AppSettingsPage() {
  const [config, setConfig] = useState(defaultConfig);
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");
  const [faviconPreview, setFaviconPreview] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAppConfig();
        if (data) setConfig({ ...defaultConfig, ...data });
      } catch (err) {
        console.error("Failed to load app settings", err);
        toast.error("Failed to load settings");
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
      await updateAppConfig(config);
      toast.success("Settings saved successfully");
    } catch (err) {
      console.error("Failed to save settings", err);
      toast.error("Failed to save settings");
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
      setLogoFile(null);
      toast.success("Logo uploaded successfully");
    } catch (err) {
      toast.error("Logo upload failed");
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
      setFaviconFile(null);
      toast.success("Favicon uploaded successfully");
    } catch (err) {
      toast.error("Favicon upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout title="App Settings">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Application Settings</h1>
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
            {isLoading ? "Saving..." : "Save Settings"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Settings Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <FaGlobe /> Basic Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Application Name *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                  value={config.appName}
                  onChange={(e) => handleChange("appName", e.target.value)}
                  placeholder="My Awesome App"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Site Title *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                  value={config.siteTitle}
                  onChange={(e) => handleChange("siteTitle", e.target.value)}
                  placeholder="Welcome to My App"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                  value={config.contactEmail || ""}
                  onChange={(e) => handleChange("contactEmail", e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Meta Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                  value={config.metaDescription || ""}
                  onChange={(e) => handleChange("metaDescription", e.target.value)}
                  placeholder="Brief description for SEO"
                />
              </div>
            </div>
          </div>

          {/* Media Settings Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <FaImage /> Media Settings
            </h2>
            
            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Application Logo
                </label>
                
                {(config.logo_url || logoPreview) && (
                  <div className="mb-3 flex items-center gap-4">
                    <img 
                      src={logoPreview || config.logo_url} 
                      alt="Logo preview" 
                      className="h-16 object-contain border border-gray-200 dark:border-gray-600 rounded"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Recommended: 300x100px (transparent PNG)
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <label className="flex-1">
                    <div className="flex items-center justify-center w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      <FaUpload className="mr-2" />
                      {logoFile ? logoFile.name : "Choose File"}
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
                      Upload
                    </button>
                  )}
                </div>
              </div>

              {/* Favicon Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Favicon
                </label>
                
                {(config.favicon_url || faviconPreview) && (
                  <div className="mb-3 flex items-center gap-4">
                    <img 
                      src={faviconPreview || config.favicon_url} 
                      alt="Favicon preview" 
                      className="h-10 w-10 object-contain border border-gray-200 dark:border-gray-600 rounded"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Recommended: 64x64px (ICO or PNG)
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <label className="flex-1">
                    <div className="flex items-center justify-center w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      <FaUpload className="mr-2" />
                      {faviconFile ? faviconFile.name : "Choose File"}
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
                      Upload
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