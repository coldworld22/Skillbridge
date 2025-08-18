import { useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { updateSEOConfig } from "@/services/admin/seoConfigService";

export default function SitemapManager({ config, update, availablePages }) {
  const { t } = useTranslation("dashboard", { keyPrefix: "seoPage.sitemap" });
  const [pages, setPages] = useState(
    config.sitemap.length
      ? config.sitemap
      : [{ path: "/", include: true, priority: 1.0, freq: "daily" }]
  );

  const changeFreqOptions = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">{t("heading")}</h2>
        <button
          onClick={regenerateSitemap}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded shadow"
        >
          {t("regenerate")}
        </button>
      </div>

      <table className="w-full table-auto border text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="p-2 text-left">{t("path")}</th>
            <th className="p-2">{t("include")}</th>
            <th className="p-2">{t("priority")}</th>
            <th className="p-2">{t("changeFreq")}</th>
            <th className="p-2">{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page, index) => (
            <tr key={index} className="border-t">
              <td className="p-2">
                <input
                  value={page.path}
                  onChange={(e) => updatePage(index, "path", e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="/path"
                  list="sitemap-pages"
                />
              </td>
              <td className="p-2 text-center">
                <input
                  type="checkbox"
                  checked={page.include}
                  onChange={(e) => updatePage(index, "include", e.target.checked)}
                />
              </td>
              <td className="p-2 text-center">
                <input
                  type="number"
                  step="0.1"
                  min="0.0"
                  max="1.0"
                  value={page.priority}
                  onChange={(e) => updatePage(index, "priority", parseFloat(e.target.value))}
                  className="w-16 text-center border rounded px-1 py-0.5"
                />
              </td>
              <td className="p-2 text-center">
                <select
                  value={page.freq}
                  onChange={(e) => updatePage(index, "freq", e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  {changeFreqOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </td>
              <td className="p-2 text-center">
                <button
                  onClick={() => deletePage(index)}
                  className="text-red-600 hover:underline"
                >
                  {t("delete")}
                </button>
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
        className="mt-2 text-sm text-yellow-600 hover:underline"
      >
        {t("addPage")}
      </button>

      {config.sitemapUpdated && (
        <div className="text-sm text-gray-500 italic">
          {t("lastUpdated", { date: config.sitemapUpdated })}
        </div>
      )}
    </div>
  );
}
