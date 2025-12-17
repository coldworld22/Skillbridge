import { useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { updateSEOConfig } from "@/services/admin/seoConfigService";
import styles from "./SEOSettings.module.scss";
import { Button } from "@/components/ui/button";

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
    <div className={styles.section}>
      <h2 className={styles.title}>{t("heading")}</h2>

      <p className={styles.description}>
        {t("description")} {" "}
        <code>{fallbackUrl}/robots.txt</code>
      </p>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={12}
        className={styles.textarea}
      />

      <div className="flex gap-4">
        <Button onClick={handleSave} variant="accent">
          {t("save")}
        </Button>

        <Button onClick={restoreDefault} variant="neutral">
          {t("restore")}
        </Button>
      </div>

      {saved && <p className="text-green-600 text-sm">{t("saved")}</p>}
    </div>
  );
}
