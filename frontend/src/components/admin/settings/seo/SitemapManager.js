import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { updateSEOConfig } from "@/services/admin/seoConfigService";
import styles from "./SEOSettings.module.scss";
import { Button } from "@/components/ui/button";

export default function SitemapManager({ config, update, availablePages }) {
  const { t } = useTranslation("dashboard", { keyPrefix: "seoPage.sitemap" });
  const [pages, setPages] = useState(
    config.sitemap.length
      ? config.sitemap
      : [{ path: "/", include: true, priority: 1.0, freq: "daily" }]
  );

  const changeFreqOptions = useMemo(
    () => [
      { value: "always", label: t("changeFreqOptions.always") },
      { value: "hourly", label: t("changeFreqOptions.hourly") },
      { value: "daily", label: t("changeFreqOptions.daily") },
      { value: "weekly", label: t("changeFreqOptions.weekly") },
      { value: "monthly", label: t("changeFreqOptions.monthly") },
      { value: "yearly", label: t("changeFreqOptions.yearly") },
      { value: "never", label: t("changeFreqOptions.never") },
    ],
    [t]
  );

  const updatePage = (index, key, value) => {
    const updated = [...pages];
    updated[index][key] = value;
    setPages(updated);
  };

  const addPage = () => {
    setPages([
      ...pages,
      { path: "", include: true, priority: 0.5, freq: "weekly" },
    ]);
  };

  const deletePage = (index) => {
    setPages(pages.filter((_, i) => i !== index));
  };

  const regenerateSitemap = async () => {
    if (pages.some((p) => p.priority < 0 || p.priority > 1)) {
      toast.error(t("invalidPriority"));
      return;
    }

    // Ensure paths are unique
    const unique = Array.from(new Map(pages.map((p) => [p.path, p])).values());
    if (unique.length !== pages.length) {
      setPages(unique);
      toast.error(t("duplicatePath"));
      return;
    }

    // Validate paths
    if (unique.some((p) => !p.path.startsWith("/") || p.path.includes(" "))) {
      toast.error(t("invalidPath"));
      return;
    }

    const updated = { ...config, sitemap: unique };
    update(updated);
    try {
      await updateSEOConfig(updated);
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    }
  };

  return (
    <div className={styles.section}>
      <div className="flex justify-between items-center">
        <h2 className={styles.title}>{t("heading")}</h2>
        <Button onClick={regenerateSitemap} variant="accent">
          {t("regenerate")}
        </Button>
      </div>

      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            <th className={styles.th} style={{ textAlign: "left" }}>{t("path")}</th>
            <th className={styles.th}>{t("include")}</th>
            <th className={styles.th}>{t("priority")}</th>
            <th className={styles.th}>{t("changeFreq")}</th>
            <th className={styles.th}>{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page, index) => (
            <tr key={index}>
              <td className={styles.td}>
                <input
                  value={page.path}
                  onChange={(e) => updatePage(index, "path", e.target.value)}
                  className={styles.input}
                  placeholder={t("pathPlaceholder")}
                  list="sitemap-pages"
                />
              </td>
              <td className={styles.td} style={{ textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={page.include}
                  onChange={(e) => updatePage(index, "include", e.target.checked)}
                />
              </td>
              <td className={styles.td} style={{ textAlign: "center" }}>
                <input
                  type="number"
                  step="0.1"
                  min="0.0"
                  max="1.0"
                  value={page.priority}
                  onChange={(e) => updatePage(index, "priority", parseFloat(e.target.value))}
                  className={styles.input}
                  style={{ width: "4rem", textAlign: "center" }}
                />
              </td>
              <td className={styles.td} style={{ textAlign: "center" }}>
                <select
                  value={page.freq}
                  onChange={(e) => updatePage(index, "freq", e.target.value)}
                  className={styles.input}
                >
                  {changeFreqOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </td>
              <td className={styles.td} style={{ textAlign: "center" }}>
                <Button onClick={() => deletePage(index)} variant="neutral" className={styles.actionButton}>
                  {t("delete")}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <datalist id="sitemap-pages">
        {availablePages.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <button
        onClick={addPage}
        className={styles.actions}
      >
        {t("addPage")}
      </button>

      {config.sitemapUpdated && (
        <div className={styles.muted} style={{ fontStyle: "italic" }}>
          {t("lastUpdated", { date: config.sitemapUpdated })}
        </div>
      )}
    </div>
  );
}
