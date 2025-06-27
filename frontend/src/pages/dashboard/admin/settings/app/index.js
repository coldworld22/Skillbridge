import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { fetchAppConfig, updateAppConfig } from "@/services/admin/appConfigService";
import { FaSave } from "react-icons/fa";
import { toast } from "react-toastify";

const defaultConfig = { appName: "", siteTitle: "" };

export default function AppSettingsPage() {
  const [config, setConfig] = useState(defaultConfig);

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
