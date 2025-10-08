import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { fetchAppConfig, updateAppConfig } from "@/services/admin/appConfigService";
import { getLanguages } from "@/services/languageService";
import { FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import useSWR, { mutate as mutateGlobal } from "swr";

export default function LanguageConfigPage() {
  const { t, i18n } = useTranslation("dashboard");
  const [config, setConfig] = useState({ defaultLanguage: "en" });
  const { data: configData } = useSWR("/app-config", fetchAppConfig, {
    onError: () => toast.error(t("settings_load_failed")),
  });
  const { data: languages } = useSWR("/languages", getLanguages, {
    onError: () => toast.error(t("settings_load_failed")),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (configData) {
      setConfig({
        ...configData,
        defaultLanguage: configData.defaultLanguage || "en",
      });
    }
  }, [configData]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await updateAppConfig(config);
      setConfig(updated);
      toast.success(t("settings_saved"));
      mutateGlobal("/app-config");
      mutateGlobal("/languages");
    } catch (err) {
      console.error(err);
      toast.error(t("settings_save_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-xl mx-auto space-y-6" dir={i18n.dir()}>
        <h1 className="text-2xl font-bold">{t("languageConfigPage.title")}</h1>
        <div>
          <label className="block font-semibold mb-1">{t("languageConfigPage.default_language")}</label>
          <select
            className="w-full border p-2 rounded"
            value={config.defaultLanguage}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, defaultLanguage: e.target.value }))
            }
          >
            {languages?.map((l) => (
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
          <FaSave /> {loading ? t("languageConfigPage.saving") : t("languageConfigPage.save")}
        </button>
      </div>
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
