import { useState, useEffect } from "react";
import { FaSpinner, FaQuestionCircle } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import MetaIssuesModal from "@/components/admin/settings/MetaIssuesModal";
import useSEOConfigStore from "@/store/seoConfigStore";
import styles from "./SEOSettings.module.scss";
import { Button } from "@/components/ui/button";

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
    <div className={styles.section} style={{ gap: "2rem" }}>
      <div>
        <h2 className={styles.title}>{t("statsHeading")}</h2>
        <div className={styles.statsGrid}>
          {stats.map((s, i) => (
            <div key={i} className={styles.statCard}>
              <div className="flex justify-between items-start">
                <div className="text-2xl">{s.icon}</div>
                {s.status && (
                  <span
                    className={`${styles.statStatus} ${
                      s.status === "ok"
                        ? styles.statusOk
                        : s.status === "warning"
                        ? styles.statusWarning
                        : styles.statusError
                    }`}
                  >
                    {s.status === "ok" ? t("ok") : s.status === "warning" ? t("warning") : t("error")}
                  </span>
                )}
              </div>
              <div className={styles.muted}>{s.label}</div>
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
          <div className={styles.muted} style={{ textAlign: "right" }}>{t("lastChecked", { date: new Date(scanTime).toLocaleString() })}</div>
        )}
      </div>

      <div>
        <h2 className={styles.title}>{t("quickActions")}</h2>
        <div className={styles.quickActions}>
          {actions.map((a, i) => (
            <div key={i} className={styles.actionCard}>
              <Button
                onClick={a.onClick}
                disabled={a.id === "regenerate" ? sitemapLoading : a.id === "scanMeta" ? scanLoading : false}
                title={a.tip}
                variant="accent"
                className={styles.actionButton}
              >
                {a.id === "regenerate" && sitemapLoading && <FaSpinner className="animate-spin" />}
                {a.id === "scanMeta" && scanLoading && <FaSpinner className="animate-spin" />}
                <span>{a.icon}</span>
                <span>{a.label}</span>
                <FaQuestionCircle className="ml-1 text-xs" />
              </Button>
              {a.id === "regenerate" && sitemapAlert && (
                <span className={`${styles.alert} ${sitemapAlert.type === "success" ? styles.success : styles.error}`}>{sitemapAlert.text}</span>
              )}
              {a.id === "scanMeta" && scanAlert && (
                <span className={`${styles.alert} ${scanAlert.type === "success" ? styles.success : styles.error}`}>{scanAlert.text}</span>
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
