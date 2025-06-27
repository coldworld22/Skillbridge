import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { fetchAppConfig, updateAppConfig, uploadAppLogo } from "@/services/admin/appConfigService";
import { FaSave } from "react-icons/fa";
import { toast } from "react-toastify";

const defaultConfig = { appName: "", siteTitle: "", logo_url: "" };

export default function AppSettingsPage() {
  const [config, setConfig] = useState(defaultConfig);
  const [logoFile, setLogoFile] = useState(null);


  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAppConfig();
        if (data) setConfig({ ...defaultConfig, ...data });
      } catch (err) {
        console.error("Failed to load app settings", err);
      }
    };
    load();
  }, []);

  const handleChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateAppConfig(config);
      toast.success("Settings saved");
    } catch (err) {
      console.error("Failed to save settings", err);
      toast.error("Failed to save settings");
    }
  };

  return (
    <AdminLayout title="App Settings">
      <div className="max-w-xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">App Settings</h1>
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div>
            <label className="block font-semibold mb-1">Application Name</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={config.appName}
              onChange={(e) => handleChange("appName", e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Site Title</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={config.siteTitle}
              onChange={(e) => handleChange("siteTitle", e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">App Logo</label>
            {config.logo_url && (
              <img src={config.logo_url} alt="logo" className="h-20 mb-2" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files[0])}
            />
            {logoFile && (
              <button
                type="button"
                className="ml-2 text-sm text-blue-600"
                onClick={async () => {
                  try {
                    const data = await uploadAppLogo(logoFile);
                    setConfig((prev) => ({ ...prev, ...data }));
                    setLogoFile(null);
                    toast.success("Logo uploaded");
                  } catch (err) {
                    toast.error("Upload failed");
                  }
                }}
              >
                Upload
              </button>
            )}
          </div>

          <div className="text-right">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              <FaSave /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
