import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { updateSEOConfig } from "@/services/admin/seoConfigService";
import styles from "./SEOSettings.module.scss";
import { Button } from "@/components/ui/button";

export default function MetaTagsManager({ config, update: updateConfig, availablePages }) {
  const { t } = useTranslation("dashboard", { keyPrefix: "seoPage.meta" });
  const pages = useMemo(() => {
    const list = availablePages.length ? availablePages : collectPages(config);
    return list.length ? list : ["/"];
  }, [availablePages, config]);
  const [selectedPage, setSelectedPage] = useState(pages[0] || "/");
  const emptyMeta = {
    title: "",
    description: "",
    keywords: "",
    canonical: "",
    noindex: false,
    nofollow: false,
  };
  const [form, setForm] = useState(emptyMeta);

  useEffect(() => {
    if (!pages.includes(selectedPage)) setSelectedPage(pages[0] || "/");
  }, [pages, selectedPage]);

  useEffect(() => {
    const meta = config.metaTags?.[selectedPage] || {};
    setForm({ ...emptyMeta, ...meta });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPage, config.metaTags]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (form.canonical) {
      try {
        // eslint-disable-next-line no-new
        new URL(form.canonical);
      } catch {
        toast.error(t("invalidCanonical"));
        return;
      }
    }
    const updated = {
      ...config,
      metaTags: { ...config.metaTags, [selectedPage]: form },
    };
    updateConfig(updated);
    try {
      await updateSEOConfig(updated);
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    }
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.title}>{t("heading")}</h2>

      <div className="flex flex-col md:flex-row items-start gap-4">
        <label className="font-medium">{t("selectPage")}</label>
        <select
          value={selectedPage}
          onChange={(e) => setSelectedPage(e.target.value)}
          className={styles.input}
          style={{ maxWidth: "16rem" }}
        >
          {pages.map((page, i) => (
            <option key={i} value={page}>{page}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={styles.field}>
          <label className="font-medium">{t("metaTitle")}</label>
          <input
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className={styles.input}
            placeholder={t("metaTitlePlaceholder")}
          />
        </div>

        <div className={styles.field}>
          <label className="font-medium">{t("metaDescription")}</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className={styles.textarea}
            placeholder={t("metaDescriptionPlaceholder")}
            rows={3}
          />
        </div>

        <div className={styles.field}>
          <label className="font-medium">{t("keywords")}</label>
          <input
            value={form.keywords}
            onChange={(e) => handleChange("keywords", e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className="font-medium">{t("canonical")}</label>
          <input
            value={form.canonical}
            onChange={(e) => handleChange("canonical", e.target.value)}
            className={styles.input}
            placeholder={t("canonicalPlaceholder")}
          />
        </div>

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={form.noindex}
            onChange={(e) => handleChange("noindex", e.target.checked)}
          />
          <span>{t("noindex")}</span>
        </label>

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={form.nofollow}
            onChange={(e) => handleChange("nofollow", e.target.checked)}
          />
          <span>{t("nofollow")}</span>
        </label>
      </div>

      <Button onClick={handleSave} variant="accent">
        {t("save")}
      </Button>
    </div>
  );
}

// helper moved from page to separate file import
function collectPages(cfg) {
  const pages = new Set(["/"]);
  if (Array.isArray(cfg?.sitemap)) {
    cfg.sitemap.forEach((p) => p.path && pages.add(p.path));
  }
  [cfg?.metaTags, cfg?.openGraph, cfg?.twitter].forEach((section) => {
    if (section) Object.keys(section).forEach((p) => pages.add(p));
  });
  return Array.from(pages).sort();
}
