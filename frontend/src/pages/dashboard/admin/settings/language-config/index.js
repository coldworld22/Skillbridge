import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { fetchAppConfig, updateAppConfig } from "@/services/admin/appConfigService";
import { getLanguages } from "@/services/languageService";
import { FaSave } from "react-icons/fa";
import { toast } from "react-toastify";

export default function LanguageConfigPage() {
  const [config, setConfig] = useState({ defaultLanguage: "en" });
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [cfg, langs] = await Promise.all([
          fetchAppConfig(),
          getLanguages(),
        ]);
        setConfig({ ...cfg, defaultLanguage: cfg.defaultLanguage || "en" });
        setLanguages(langs || []);
      } catch (err) {
        console.error("Failed to load data", err);
        toast.error("Failed to load settings");
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await updateAppConfig(config);
      setConfig(updated);
      toast.success("Settings saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Language Config</h1>
        <div>
          <label className="block font-semibold mb-1">Default Language</label>
          <select
            className="w-full border p-2 rounded"
            value={config.defaultLanguage}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, defaultLanguage: e.target.value }))
            }
          >
            {languages.map((l) => (
              <option key={l.id} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-yellow-500 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FaSave /> {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </AdminLayout>
  );
}
