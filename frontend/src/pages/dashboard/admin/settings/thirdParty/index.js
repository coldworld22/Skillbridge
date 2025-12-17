// pages/dashboard/admin/settings/thirdParty.js
import AdminLayout from "@/components/layouts/AdminLayout";
import { useState, useMemo, useEffect, Fragment } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import {
  fetchThirdPartyConfig,
  updateThirdPartyConfig,
} from "@/services/admin/thirdPartyService";
import { toast } from "react-toastify";
import {
  FaRobot,
  FaWrench,
  FaGoogle,
  FaChartBar,
  FaAd,
  FaBullhorn,
} from "react-icons/fa";

// Modal Components
import ChatGPTModal from "@/components/admin/integrations/ChatGPTModal";
import DeepSeekModal from "@/components/admin/integrations/DeepSeekModal";
import GeminiModal from "@/components/admin/integrations/GeminiModal";
import GoogleAnalyticsModal from "@/components/admin/integrations/GoogleAnalyticsModal";
import GoogleAdSenseModal from "@/components/admin/integrations/GoogleAdSenseModal";
import GoogleAdsModal from "@/components/admin/integrations/GoogleAdsModal";
import { computeAvailableProviders } from "@/utils/aiProviders";
import styles from "../settings.module.scss";

const skeletonCount = 6;

const IntegrationCardPlaceholder = () => (
  <div className={`${styles.card} ${styles.skeletonCard}`}>
    <div className={styles.skeletonRow}>
      <div className={styles.skeletonCircle} />
      <div className={styles.skeletonBody}>
        <div className={styles.skeletonLine} />
        <div className={`${styles.skeletonLine} ${styles.skeletonShort}`} />
      </div>
      <div className={styles.skeletonPill} />
    </div>
  </div>
);

const StatusPill = ({ active, configured }) => {
  if (!active) {
    return <span className={`${styles.statusBadge} ${styles.badgeDefault}`}>Inactive</span>;
  }
  if (!configured) {
    return <span className={`${styles.statusBadge} ${styles.badgeWarning}`}>Needs setup</span>;
  }
  return <span className={`${styles.statusBadge} ${styles.badgeSuccess}`}>Active</span>;
};

const IntegrationCard = ({ item, settings, onToggle, onOpen, disabled }) => {
  const info = settings[item.key] || {};
  const isActive = info.active !== false;
  const configured = item.isConfigured ? item.isConfigured(info) : true;
  const Icon = item.icon;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`${styles.integrationCard} ${disabled ? styles.cardDisabled : ""}`}
    >
      <div className={styles.integrationHeader}>
        <span className={styles.integrationIcon} style={{ color: item.iconColor }}>
          <Icon />
        </span>
        <div className={styles.integrationMeta}>
          <div className={styles.integrationTop}>
            <div>
              <h2 className={styles.cardTitle}>{item.name}</h2>
              <p className={styles.subtitle}>{item.description}</p>
            </div>
            <StatusPill active={isActive} configured={configured} />
          </div>
          {item.hint && <p className={styles.mutedText}>{item.hint}</p>}
        </div>
      </div>
      <div className={styles.integrationFooter}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(item.key);
          }}
          className={isActive ? styles.buttonPrimary : styles.buttonSecondary}
          disabled={disabled}
        >
          {isActive ? "Deactivate" : "Activate"}
        </button>
        <span className={styles.mutedText}>
          {configured
            ? item.configuredLabel || "Configuration saved"
            : item.unconfiguredLabel || "Click to finish configuration"}
        </span>
      </div>
    </div>
  );
};

export default function ThirdPartyIntegrationsPage() {
  const { t, i18n } = useTranslation("dashboard");
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [showChatGPTModal, setShowChatGPTModal] = useState(false);
  const [showDeepSeekModal, setShowDeepSeekModal] = useState(false);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [showGoogleAnalyticsModal, setShowGoogleAnalyticsModal] = useState(false);
  const [showGoogleAdSenseModal, setShowGoogleAdSenseModal] = useState(false);
  const [showGoogleAdsModal, setShowGoogleAdsModal] = useState(false);
  const { providers: availableProviders, defaultProvider } = useMemo(
    () => computeAvailableProviders(settings),
    [settings]
  );

  const handleDefaultProviderChange = async (value) => {
    if (savingKey || value === settings?.aiDefault?.provider) return;
    await saveSection("aiDefault", { provider: value });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchThirdPartyConfig();
        if (data) {
          setSettings(data);
        } else {
          setSettings({});
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveSection = async (key, data) => {
    setSavingKey(key);
    try {
      const updated = await updateThirdPartyConfig({
        ...settings,
        [key]: data,
      });
      setSettings(updated);
      toast.success(t("settings_saved"));
    } catch (err) {
      console.error(err);
      toast.error(t("settings_save_failed"));
    }
    setSavingKey(null);
  };

  const toggleIntegration = (key) => {
    if (savingKey) return;
    const current = settings[key] || {};
    const isActive = current.active !== false;
    saveSection(key, { ...current, active: !isActive });
  };

  const integrations = useMemo(
    () => [
      {
        key: "chatgpt",
        name: "ChatGPT (OpenAI)",
        description: "Manage your OpenAI API keys, models, and usage preferences.",
        icon: FaRobot,
        iconColor: "#2563eb",
        hint: "Requires an active OpenAI API key.",
        isConfigured: (cfg) => Boolean(cfg?.apiKey),
        onOpen: () => setShowChatGPTModal(true),
      },
      {
        key: "deepseek",
        name: "DeepSeek AI",
        description: "Configure DeepSeek large language model settings.",
        icon: FaWrench,
        iconColor: "#16a34a",
        hint: "Set API key and preferred DeepSeek model.",
        isConfigured: (cfg) => Boolean(cfg?.apiKey),
        onOpen: () => setShowDeepSeekModal(true),
      },
      {
        key: "gemini",
        name: "Gemini (Google AI)",
        description: "Integrate Gemini AI models from Google Cloud.",
        icon: FaGoogle,
        iconColor: "#4f46e5",
        hint: "Requires a Google Cloud Generative AI API key.",
        isConfigured: (cfg) => Boolean(cfg?.apiKey),
        onOpen: () => setShowGeminiModal(true),
      },
      {
        key: "googleAnalytics",
        name: "Google Analytics",
        description: "Track user activity using Google Analytics.",
        icon: FaChartBar,
        iconColor: "#15803d",
        hint: "Add your GA4 measurement ID to enable tracking.",
        configuredLabel: "Measurement ID saved",
        isConfigured: (cfg) => Boolean(cfg?.measurementId),
        onOpen: () => setShowGoogleAnalyticsModal(true),
      },
      {
        key: "googleAds",
        name: "Google Ads",
        description: "Manage Google Ads conversion tracking and remarketing.",
        icon: FaBullhorn,
        iconColor: "#2563eb",
        hint: "Define conversion ID and event mappings for conversions.",
        configuredLabel: "Conversion ID saved",
        isConfigured: (cfg) => Boolean(cfg?.conversionId),
        onOpen: () => setShowGoogleAdsModal(true),
      },
      {
        key: "googleAdSense",
        name: "Google AdSense",
        description: "Display monetized ads using Google AdSense.",
        icon: FaAd,
        iconColor: "#f59e0b",
        hint: "Add publisher ID and slot IDs before enabling ads.",
        configuredLabel: "Publisher ID saved",
        isConfigured: (cfg) => Boolean(cfg?.publisherId),
        onOpen: () => setShowGoogleAdSenseModal(true),
      },
    ],
    [settings]
  );

  return (
    <AdminLayout>
      <div className={styles.page} dir={i18n.dir()}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{t("third_party_integrations")}</h1>
            <p className={styles.subtitle}>
              Manage AI providers and Google services used across the platform.
            </p>
          </div>
          {savingKey && (
            <span className={`${styles.statusBadge} ${styles.badgeWarning}`}>
              Saving changes…
            </span>
          )}
        </div>

        <div className={`${styles.card} ${styles.inlineCard}`}>
          <div>
            <h2 className={styles.cardTitle}>Default AI Provider</h2>
            <p className={styles.subtitle}>
              Controls which provider the homepage chatbot and AI sections use by default.
            </p>
          </div>
          <div className={styles.selectWrap}>
            <select
              value={defaultProvider || ""}
              onChange={(e) => handleDefaultProviderChange(e.target.value)}
              disabled={!availableProviders.length || savingKey === "aiDefault"}
              className={styles.select}
            >
              {availableProviders.length ? (
                availableProviders.map((prov) => (
                  <option key={prov.key} value={prov.key}>
                    {prov.label}
                  </option>
                ))
              ) : (
                <option value="">No active AI providers</option>
              )}
            </select>
          </div>
        </div>

        {loading ? (
          <div className={styles.integrationGrid}>
            {Array.from({ length: skeletonCount }).map((_, idx) => (
              <IntegrationCardPlaceholder key={`placeholder-${idx}`} />
            ))}
          </div>
        ) : (
          <Fragment>
            <div className={styles.integrationGrid}>
              {integrations.map((item) => (
                <IntegrationCard
                  key={item.key}
                  item={item}
                  settings={settings}
                  onToggle={toggleIntegration}
                  onOpen={item.onOpen}
                  disabled={savingKey === item.key}
                />
              ))}
            </div>
            <p className={styles.mutedText} style={{ marginTop: "1rem" }}>
              Tip: click any card to review or update its credentials. You can deactivate an integration at any time without losing stored configuration.
            </p>
          </Fragment>
        )}
      </div>

      {/* Pop Modals */}
      {showChatGPTModal && (
        <ChatGPTModal
          initialData={settings.chatgpt}
          onSave={(data) => saveSection("chatgpt", data)}
          onClose={() => setShowChatGPTModal(false)}
        />
      )}
      {showDeepSeekModal && (
        <DeepSeekModal
          initialData={settings.deepseek}
          onSave={(data) => saveSection("deepseek", data)}
          onClose={() => setShowDeepSeekModal(false)}
        />
      )}
      {showGeminiModal && (
        <GeminiModal
          initialData={settings.gemini}
          onSave={(data) => saveSection("gemini", data)}
          onClose={() => setShowGeminiModal(false)}
        />
      )}
      {showGoogleAnalyticsModal && (
        <GoogleAnalyticsModal
          initialData={settings.googleAnalytics}
          onSave={(data) => saveSection("googleAnalytics", data)}
          onClose={() => setShowGoogleAnalyticsModal(false)}
        />
      )}
      {showGoogleAdSenseModal && (
        <GoogleAdSenseModal
          initialData={settings.googleAdSense}
          onSave={(data) => saveSection("googleAdSense", data)}
          onClose={() => setShowGoogleAdSenseModal(false)}
        />
      )}
      {showGoogleAdsModal && (
        <GoogleAdsModal
          initialData={settings.googleAds}
          onSave={(data) => saveSection("googleAds", data)}
          onClose={() => setShowGoogleAdsModal(false)}
        />
      )}
    </AdminLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
