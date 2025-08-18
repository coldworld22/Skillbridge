import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { updateSEOConfig } from "@/services/admin/seoConfigService";

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
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">{t("heading")}</h2>

      <div className="grid md:grid-cols-4 gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={globalSEO.forceCanonical}
            onChange={(e) => handleGlobalChange("forceCanonical", e.target.checked)}
          />
          {t("forceCanonical")}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={globalSEO.noindexSitewide}
            onChange={(e) => handleGlobalChange("noindexSitewide", e.target.checked)}
          />
          {t("noindexSitewide")}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={globalSEO.nofollowSitewide}
            onChange={(e) => handleGlobalChange("nofollowSitewide", e.target.checked)}
          />
          {t("nofollowSitewide")}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={globalSEO.autoPingSitemap}
            onChange={(e) => handleGlobalChange("autoPingSitemap", e.target.checked)}
          />
          {t("autoPingSitemap")}
        </label>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{t("redirects")}</h2>
        <table className="w-full table-auto border text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2">{t("from")}</th>
              <th className="p-2">{t("to")}</th>
              <th className="p-2">{t("status")}</th>
              <th className="p-2">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {redirects.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={r.from}
                    onChange={(e) => handleRedirectChange(i, "from", e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={r.to}
                    onChange={(e) => handleRedirectChange(i, "to", e.target.value)}
                  />
                </td>
                <td className="p-2 text-center">
                  <select
                    value={r.code}
                    onChange={(e) => handleRedirectChange(i, "code", parseInt(e.target.value))}
                    className="border rounded px-2 py-1"
                  >
                    <option value={301}>301</option>
                    <option value={302}>302</option>
                  </select>
                </td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => deleteRedirect(i)}
                    className="text-red-600 hover:underline"
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
          className="text-yellow-600 hover:underline text-sm"
        >
          {t("addRedirect")}
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{t("jsonLd")}</h2>
        <textarea
          value={jsonSchema}
          onChange={(e) => setJsonSchema(e.target.value)}
          rows={10}
          className="w-full border rounded px-3 py-2 font-mono text-sm"
        />
      </div>

      <button
        onClick={handleSave}
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded"
      >
        {t("save")}
      </button>
    </div>
  );
}
