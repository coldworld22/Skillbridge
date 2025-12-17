import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { updateSEOConfig, uploadImage } from "@/services/admin/seoConfigService";
import styles from "./SEOSettings.module.scss";
import { Button } from "@/components/ui/button";

export default function TwitterCardSettings({ config, update, availablePages }) {
  const { t } = useTranslation("dashboard", { keyPrefix: "seoPage.twitter" });
  const pages = useMemo(() => {
    const list = availablePages.length ? availablePages : collectPages(config);
    return list.length ? list : ["/"];
  }, [availablePages, config]);
  const [selectedPage, setSelectedPage] = useState(pages[0] || "/");
  const defaultHandle = t("defaultHandle");
  const emptyTwitter = useMemo(
    () => ({
      title: "",
      description: "",
      cardType: "summary",
      image: "",
      handle: defaultHandle,
    }),
    [defaultHandle]
  );
  const cardTypeOptions = useMemo(
    () => [
      { value: "summary", label: t("cardTypeOptions.summary") },
      { value: "summary_large_image", label: t("cardTypeOptions.summary_large_image") },
      { value: "app", label: t("cardTypeOptions.app") },
      { value: "player", label: t("cardTypeOptions.player") },
    ],
    [t]
  );
  const [form, setForm] = useState(emptyTwitter);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      handleChange("image", url);
    } catch {
      toast.error(t("uploadFailed"));
    }
  };

  useEffect(() => {
    if (!pages.includes(selectedPage)) setSelectedPage(pages[0] || "/");
  }, [pages, selectedPage]);

  useEffect(() => {
    const data = config.twitter?.[selectedPage] || {};
    setForm({ ...emptyTwitter, ...data });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPage, config.twitter, emptyTwitter]);


  const handleSave = async () => {
    if (form.handle && !form.handle.startsWith('@')) {
      toast.error(t("invalidHandle"));
      return;
    }
    const updated = {
      ...config,
      twitter: { ...config.twitter, [selectedPage]: form },
    };
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
      <h2 className={styles.title}>{t("heading")}</h2>

      <div className={styles.field}>
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

      <div className="grid md:grid-cols-2 gap-6">
        <div className={styles.field}>
          <label className="font-medium">{t("title")}</label>
          <input
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className={styles.input}
            placeholder={t("titlePlaceholder")}
          />
        </div>

        <div className={styles.field}>
          <label className="font-medium">{t("description")}</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className={styles.textarea}
            placeholder={t("descriptionPlaceholder")}
            rows={3}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div className={styles.field}>
          <label className="font-medium">{t("cardType")}</label>
          <select
            value={form.cardType}
            onChange={(e) => handleChange("cardType", e.target.value)}
            className={styles.input}
          >
            {cardTypeOptions.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-medium">{t("image")}</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {form.image && (
            <img src={form.image} alt={t("imagePreviewAlt")} className="mt-2 w-48 rounded shadow" />
          )}
        </div>
      </div>

      <div>
        <label className="font-medium">{t("handle")}</label>
        <input
          value={form.handle}
          onChange={(e) => handleChange("handle", e.target.value)}
          className={styles.input}
          placeholder={t("handlePlaceholder")}
        />
      </div>

      <Button onClick={handleSave} variant="accent">
        {t("save")}
      </Button>
    </div>
  );
}

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
