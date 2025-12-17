import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { updateSEOConfig } from "@/services/admin/seoConfigService";
import styles from "./SEOSettings.module.scss";
import { Button } from "@/components/ui/button";

export default function AdvancedSEOSettings({ config, update }) {
  const { t } = useTranslation("dashboard", { keyPrefix: "seoPage.advanced" });
  const defaultGlobal = {
    forceCanonical: true,
    noindexSitewide: false,
    nofollowSitewide: false,
    autoPingSitemap: true,
  };
  const [globalSEO, setGlobalSEO] = useState(defaultGlobal);
  const [redirects, setRedirects] = useState([]);
  const fallbackUrl = process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const [jsonSchema, setJsonSchema] = useState(`{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SkillBridge",
  "url": "${fallbackUrl}"
}`);

  const handleGlobalChange = (key, value) => {
    setGlobalSEO((prev) => ({ ...prev, [key]: value }));
  };

  const handleRedirectChange = (i, key, value) => {
    const updated = [...redirects];
    updated[i][key] = value;
    setRedirects(updated);
  };

  const addRedirect = () => {
    setRedirects([...redirects, { from: "", to: "", code: 301 }]);
  };

  const deleteRedirect = (i) => {
    const updated = redirects.filter((_, idx) => idx !== i);
    setRedirects(updated);
  };

  useEffect(() => {
    if (config.globalSEO) setGlobalSEO({ ...defaultGlobal, ...config.globalSEO });
    if (config.redirects) setRedirects(config.redirects);
    if (config.jsonSchema) setJsonSchema(config.jsonSchema);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const handleSave = async () => {
    if (redirects.some(r => !r.from.startsWith('/') || !r.to.startsWith('/'))) {
      toast.error(t("invalidRedirect"));
      return;
    }
    try {
      JSON.parse(jsonSchema);
    } catch {
      toast.error(t("invalidJson"));
      return;
    }

    const updated = { ...config, globalSEO, redirects, jsonSchema };
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

      <div className={styles.grid}>
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={globalSEO.forceCanonical}
            onChange={(e) => handleGlobalChange("forceCanonical", e.target.checked)}
          />
          {t("forceCanonical")}
        </label>
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={globalSEO.noindexSitewide}
            onChange={(e) => handleGlobalChange("noindexSitewide", e.target.checked)}
          />
          {t("noindexSitewide")}
        </label>
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={globalSEO.nofollowSitewide}
            onChange={(e) => handleGlobalChange("nofollowSitewide", e.target.checked)}
          />
          {t("nofollowSitewide")}
        </label>
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={globalSEO.autoPingSitemap}
            onChange={(e) => handleGlobalChange("autoPingSitemap", e.target.checked)}
          />
          {t("autoPingSitemap")}
        </label>
      </div>

      <div>
        <h2 className={styles.sectionTitle}>{t("redirects")}</h2>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>{t("from")}</th>
              <th className={styles.th}>{t("to")}</th>
              <th className={styles.th}>{t("status")}</th>
              <th className={styles.th}>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {redirects.map((r, i) => (
              <tr key={i}>
                <td className={styles.td}>
                  <input
                    className={styles.input}
                    value={r.from}
                    onChange={(e) => handleRedirectChange(i, "from", e.target.value)}
                  />
                </td>
                <td className={styles.td}>
                  <input
                    className={styles.input}
                    value={r.to}
                    onChange={(e) => handleRedirectChange(i, "to", e.target.value)}
                  />
                </td>
                <td className={styles.td} style={{ textAlign: "center" }}>
                  <select
                    value={r.code}
                    onChange={(e) => handleRedirectChange(i, "code", parseInt(e.target.value))}
                    className={styles.input}
                  >
                    <option value={301}>301</option>
                    <option value={302}>302</option>
                  </select>
                </td>
                <td className={styles.td} style={{ textAlign: "center" }}>
                  <button
                    onClick={() => deleteRedirect(i)}
                    className={styles.actions}
                  >
                    {t("delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={addRedirect}
          className={styles.actions}
        >
          {t("addRedirect")}
        </button>
      </div>

      <div>
        <h2 className={styles.sectionTitle}>{t("jsonLd")}</h2>
        <textarea
          value={jsonSchema}
          onChange={(e) => setJsonSchema(e.target.value)}
          rows={10}
          className={styles.textarea}
        />
      </div>

      <Button onClick={handleSave} variant="accent">
        {t("save")}
      </Button>
    </div>
  );
}
