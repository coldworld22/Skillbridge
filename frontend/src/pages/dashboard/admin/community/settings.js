import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import SettingsPanel from "@/components/admin/community/SettingsPanel";
import ConfirmModal from "@/components/common/ConfirmModal";
import { toast } from "react-toastify";
import {
  fetchCommunitySettings,
  updateCommunitySettings,
} from "@/services/admin/communityService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

export default function AdminCommunitySettingsPage() {
  const { t } = useTranslation("dashboard", {
    keyPrefix: "communitySettingsPage",
  });
  const [settings, setSettings] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const defaultSettings = [
    { key: "allowGuestPosts", label: t("settings.allowGuestPosts"), enabled: false },
    { key: "enableAnonymousReplies", label: t("settings.enableAnonymousReplies"), enabled: true },
    { key: "requireEmailVerification", label: t("settings.requireEmailVerification"), enabled: true },
    { key: "highlightFeaturedTags", label: t("settings.highlightFeaturedTags"), enabled: true },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCommunitySettings();
        const mapped = data.length
          ? data.map((s) => ({ ...s, label: t(`settings.${s.key}`) }))
          : defaultSettings;
        setSettings(mapped);
      } catch (_err) {
        toast.error(t("load_failed"));
        setSettings(defaultSettings);
      }
    };
    load();
  }, [t]);

  const handleToggle = (key) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.key === key ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const handleSave = () => setConfirmOpen(true);

  const handleConfirmSave = async () => {
    try {
      await updateCommunitySettings(settings);
      toast.success(t("save_success"));
    } catch (err) {
      toast.error(err?.response?.data?.message || t("save_failed"));
    }
  };

  return (
    <AdminLayout title={t("title")}>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

        <SettingsPanel settings={settings} onToggle={handleToggle} />

        <button
          onClick={handleSave}
          className="mt-6 bg-yellow-500 px-6 py-2 text-white rounded font-semibold hover:bg-yellow-600"
        >
          {t("save_changes")}
        </button>
        <ConfirmModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirmSave}
          message={t("confirm_save")}
        />
      </div>
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
