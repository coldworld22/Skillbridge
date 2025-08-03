import { useState, useEffect } from "react";
import { FaSpinner, FaQuestionCircle } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import MetaIssuesModal from "@/components/admin/settings/MetaIssuesModal";
import useSEOConfigStore from "@/store/seoConfigStore";

export default function SEOOverview({ config, onChangeTab }) {
  const { t } = useTranslation("dashboard", { keyPrefix: "seoPage.overview" });
  const regenerate = useSEOConfigStore((s) => s.regenerate);
  const scan = useSEOConfigStore((s) => s.scan);
  const [sitemapLoading, setSitemapLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [sitemapAlert, setSitemapAlert] = useState(null);
  const [scanAlert, setScanAlert] = useState(null);
  const [issues, setIssues] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [scanTime, setScanTime] = useState(config.lastChecked);

  useEffect(() => {
    setScanTime(config.lastChecked);
  }, [config.lastChecked]);

  const stats = config.stats
    ? [
        {
          label: t("indexed"),
          value: config.stats.indexedPages,
          icon: "🧭",
          status: Array.isArray(config.stats.indexedPages)
            ? config.stats.indexedPages.length > 0
              ? "ok"
              : "warning"
            : config.stats.indexedPages > 0
            ? "ok"
            : "warning",
        },
        {
          label: t("missingMeta"),
          value: config.stats.pagesMissingMeta,
          icon: "⚠️",
          status: config.stats.pagesMissingMeta > 0 ? "warning" : "ok",
        },
        {
          label: t("sitemapUpdated"),
          value: config.stats.sitemapUpdated || "-",
          icon: "📆",
          status: config.stats.sitemapUpdated ? "ok" : "warning",
        },
        {
          label: t("robotsStatus"),
          value: config.stats.robotsStatus,
          icon: "🤖",
          status: config.stats.robotsStatus === "Active" ? "ok" : "error",
        },
        {
          label: t("ogReady"),
          value: config.stats.openGraphReady,
          icon: "📸",
          status: config.stats.openGraphReady > 0 ? "ok" : "warning",
        },
      ]
    : [];

  const actions = [
    {
      id: "regenerate",
      label: t("actions.regenerateSitemap"),
      icon: "🔁",
      tip: t("actions.regenerateTip"),
      onClick: async () => {
        setSitemapLoading(true);
        setSitemapAlert(null);
        try {
          await regenerate();
          setSitemapAlert({ type: "success", text: t("sitemapSuccess") });
        } catch {
          setSitemapAlert({ type: "error", text: t("sitemapFail") });
        } finally {
          setSitemapLoading(false);
        }
      },
    },
    {
      id: "editRobots",
      label: t("actions.editRobots"),
      icon: "✏️",
      tip: t("actions.editRobotsTip"),
      onClick: () => onChangeTab("robots"),
    },
    {
      id: "scanMeta",
      label: t("actions.scanMeta"),
      icon: "🕵️",
      tip: t("actions.scanMetaTip"),
      onClick: async () => {
        setScanLoading(true);
        setScanAlert(null);
        try {
          const res = await scan();
          setIssues(res.issues || []);
          setShowModal(true);
          setScanTime(res.scannedAt);
          setScanAlert({ type: "success", text: t("scanSuccess", { count: res.issues.length }) });
        } catch {
          setScanAlert({ type: "error", text: t("scanFail") });
        } finally {
          setScanLoading(false);
        }
      },
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-800">{t("statsHeading")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-gray-50 border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="text-2xl">{s.icon}</div>
                {s.status && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      s.status === "ok"
                        ? "bg-green-100 text-green-800"
                        : s.status === "warning"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {s.status === "ok" ? t("ok") : s.status === "warning" ? t("warning") : t("error")}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600 mt-1">{s.label}</div>
              <div className="text-xl font-bold text-yellow-600">
                {Array.isArray(s.value) ? s.value.length : s.value}
              </div>
              {Array.isArray(s.value) && s.value.length > 0 && (
                <details className="mt-1 text-sm">
                  <summary className="cursor-pointer text-blue-600">{t("viewPages")}</summary>
                  <ul className="list-disc list-inside mt-1">
                    {s.value.map((p) => (
                      <li key={p}>
                        <a href={p} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {p}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))}
        </div>
        {scanTime && (
          <div className="text-xs text-gray-500 mt-2 text-right">{t("lastChecked", { date: new Date(scanTime).toLocaleString() })}</div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-800">{t("quickActions")}</h2>
        <div className="flex flex-wrap gap-4">
          {actions.map((a, i) => (
            <div key={i} className="flex flex-col items-start">
              <button
                onClick={a.onClick}
                disabled={a.id === "regenerate" ? sitemapLoading : a.id === "scanMeta" ? scanLoading : false}
                title={a.tip}
                className="flex items-center gap-2 bg-yellow-500 disabled:opacity-50 hover:bg-yellow-600 text-white px-4 py-2 rounded-md shadow"
              >
                {a.id === "regenerate" && sitemapLoading && <FaSpinner className="animate-spin" />}
                {a.id === "scanMeta" && scanLoading && <FaSpinner className="animate-spin" />}
                <span>{a.icon}</span>
                <span>{a.label}</span>
                <FaQuestionCircle className="ml-1 text-xs" />
              </button>
              {a.id === "regenerate" && sitemapAlert && (
                <span className={`mt-1 text-sm ${sitemapAlert.type === "success" ? "text-green-600" : "text-red-600"}`}>{sitemapAlert.text}</span>
              )}
              {a.id === "scanMeta" && scanAlert && (
                <span className={`mt-1 text-sm ${scanAlert.type === "success" ? "text-green-600" : "text-red-600"}`}>{scanAlert.text}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <MetaIssuesModal
        issues={issues}
        open={showModal}
        onClose={() => setShowModal(false)}
        lastChecked={scanTime}
        onEdit={() => onChangeTab('meta')}
      />
    </div>
  );
}
