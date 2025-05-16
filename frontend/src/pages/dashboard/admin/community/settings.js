import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import SettingsPanel from "@/components/admin/community/SettingsPanel";

const defaultSettings = [
  { key: "allowGuestPosts", label: "Allow guest users to post", enabled: false },
  { key: "enableAnonymousReplies", label: "Enable anonymous replies", enabled: true },
  { key: "requireEmailVerification", label: "Require email verification before posting", enabled: true },
  { key: "highlightFeaturedTags", label: "Highlight featured tags on homepage", enabled: true },
];

export default function AdminCommunitySettingsPage() {
  const [settings, setSettings] = useState([]);

  useEffect(() => {
    setSettings(defaultSettings); // Load from API/backend in real use
  }, []);

  const handleToggle = (key) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.key === key ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const handleSave = () => {
    // In real case, you'd call an API to save settings
    alert("Settings saved successfully!");
    console.log("Saved settings:", settings);
  };

  return (
    <AdminLayout title="Community Settings">
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Community Settings</h1>

        <SettingsPanel settings={settings} onToggle={handleToggle} />

        <button
          onClick={handleSave}
          className="mt-6 bg-yellow-500 px-6 py-2 text-white rounded font-semibold hover:bg-yellow-600"
        >
          Save Changes
        </button>
      </div>
    </AdminLayout>
  );
}
