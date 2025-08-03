import { useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { updateSEOConfig } from "@/services/admin/seoConfigService";

export default function RobotsEditor({ config, update }) {
  const { t } = useTranslation("dashboard", { keyPrefix: "seoPage.robots" });
  const fallbackUrl = process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const defaultContent = `User-agent: *\nDisallow: /dashboard/\nDisallow: /admin/\nAllow: /\n\nSitemap: ${fallbackUrl}/sitemap.xml`;

  const [content, setContent] = useState(config.robots || defaultContent);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const updated = { ...config, robots: content };
    update(updated);
    try {
      await updateSEOConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error(t("saveFailed"));
    }
  };

  const restoreDefault = () => {
    setContent(defaultContent);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">{t("heading")}</h2>

      <p className="text-sm text-gray-600">
        {t("description")} {" "}
        <code className="text-yellow-600">{fallbackUrl}/robots.txt</code>
      </p>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={12}
        className="w-full border rounded px-4 py-3 font-mono text-sm bg-gray-50"
      />

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded shadow"
        >
          {t("save")}
        </button>

        <button
          onClick={restoreDefault}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded"
        >
          {t("restore")}
        </button>
      </div>

      {saved && <p className="text-green-600 text-sm">{t("saved")}</p>}
    </div>
  );
}
