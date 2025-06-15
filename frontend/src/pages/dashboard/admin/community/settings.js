import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import SettingsPanel from "@/components/admin/community/SettingsPanel";
import {
  fetchCommunitySettings,
  updateCommunitySettings,
} from "@/services/admin/communityService";

const defaultSettings = [
  { key: "allowGuestPosts", label: "Allow guest users to post", enabled: false },
  { key: "enableAnonymousReplies", label: "Enable anonymous replies", enabled: true },
  { key: "requireEmailVerification", label: "Require email verification before posting", enabled: true },
  { key: "highlightFeaturedTags", label: "Highlight featured tags on homepage", enabled: true },
];

export default function AdminCommunitySettingsPage() {
  const [settings, setSettings] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchCommunitySettings();
      setSettings(data.length ? data : defaultSettings);
    };
    load();
  }, []);

  const handleToggle = (key) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.key === key ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const handleSave = async () => {
    await updateCommunitySettings(settings);
    alert("Settings saved successfully!");
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
