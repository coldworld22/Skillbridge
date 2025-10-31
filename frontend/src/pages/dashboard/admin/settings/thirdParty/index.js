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

const skeletonCount = 6;

const IntegrationCardPlaceholder = () => (
  <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm animate-pulse">
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 rounded-full bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-full" />
      </div>
      <div className="h-6 w-20 bg-gray-200 rounded" />
    </div>
  </div>
);

const StatusPill = ({ active, configured }) => {
  if (!active) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">
        Inactive
      </span>
    );
  }
  if (!configured) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
        Needs setup
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
      Active
    </span>
  );
};

const IntegrationCard = ({ item, settings, onToggle, onOpen, disabled }) => {
  const info = settings[item.key] || {};
  const isActive = info.active !== false;
  const configured = item.isConfigured ? item.isConfigured(info) : true;

  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      className={`group text-left border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-lg bg-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-yellow-400 ${
        disabled ? "opacity-70 cursor-not-allowed" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <span className="text-4xl group-hover:scale-105 transition-transform">
          <Icon className={item.iconClass} />
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {item.name}
              </h2>
              <p className="text-sm text-gray-600">
                {item.description}
              </p>
            </div>
            <StatusPill active={isActive} configured={configured} />
          </div>
          {item.hint && (
            <p className="mt-2 text-xs text-gray-500">
              {item.hint}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(item.key);
          }}
          className={`px-3 py-1.5 rounded text-sm font-medium ${
            isActive
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          disabled={disabled}
        >
          {isActive ? "Deactivate" : "Activate"}
        </button>
        <span className="text-xs text-gray-500">
          {configured
            ? item.configuredLabel || "Configuration saved"
            : item.unconfiguredLabel || "Click to finish configuration"}
        </span>
      </div>
    </button>
  );
};

export default function ThirdPartyIntegrationsPage() {
  const { t } = useTranslation("dashboard");
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [showChatGPTModal, setShowChatGPTModal] = useState(false);
  const [showDeepSeekModal, setShowDeepSeekModal] = useState(false);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [showGoogleAnalyticsModal, setShowGoogleAnalyticsModal] =
    useState(false);
  const [showGoogleAdSenseModal, setShowGoogleAdSenseModal] =
    useState(false);
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
      key: 'chatgpt',
      name: "ChatGPT (OpenAI)",
      description: "Manage your OpenAI API keys, models, and usage preferences.",
      icon: FaRobot,
      iconClass: "text-4xl text-blue-600",
      hint: "Requires an active OpenAI API key.",
      isConfigured: (cfg) => Boolean(cfg?.apiKey),
      onOpen: () => setShowChatGPTModal(true),
    },
    {
      key: 'deepseek',
      name: "DeepSeek AI",
      description: "Configure DeepSeek large language model settings.",
      icon: FaWrench,
      iconClass: "text-4xl text-green-600",
      hint: "Set API key and preferred DeepSeek model.",
      isConfigured: (cfg) => Boolean(cfg?.apiKey),
      onOpen: () => setShowDeepSeekModal(true),
    },
    {
      key: 'gemini',
      name: "Gemini (Google AI)",
      description: "Integrate Gemini AI models from Google Cloud.",
      icon: FaGoogle,
      iconClass: "text-4xl text-indigo-600",
      hint: "Requires a Google Cloud Generative AI API key.",
      isConfigured: (cfg) => Boolean(cfg?.apiKey),
      onOpen: () => setShowGeminiModal(true),
    },
    {
      key: 'googleAnalytics',
      name: "Google Analytics",
      description: "Track user activity using Google Analytics.",
      icon: FaChartBar,
      iconClass: "text-4xl text-green-700",
      hint: "Add your GA4 measurement ID to enable tracking.",
      configuredLabel: "Measurement ID saved",
      isConfigured: (cfg) => Boolean(cfg?.measurementId),
      onOpen: () => setShowGoogleAnalyticsModal(true),
    },
    {
      key: 'googleAds',
      name: "Google Ads",
      description: "Manage Google Ads conversion tracking and remarketing.",
      icon: FaBullhorn,
      iconClass: "text-4xl text-blue-500",
      hint: "Define conversion ID and event mappings for conversions.",
      configuredLabel: "Conversion ID saved",
      isConfigured: (cfg) => Boolean(cfg?.conversionId),
      onOpen: () => setShowGoogleAdsModal(true),
    },
    {
      key: 'googleAdSense',
      name: "Google AdSense",
      description: "Display monetized ads using Google AdSense.",
      icon: FaAd,
      iconClass: "text-4xl text-yellow-600",
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
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t("third_party_integrations")}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage AI providers and Google services used across the platform.
            </p>
          </div>
          {savingKey && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm">
              <span className="h-2 w-2 rounded-full bg-yellow-500 animate-ping" />
              Saving changes…
            </span>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Default AI Provider
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Controls which provider the homepage chatbot and AI sections use
                by default.
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <select
                value={defaultProvider || ""}
                onChange={(e) => handleDefaultProviderChange(e.target.value)}
                disabled={!availableProviders.length || savingKey === "aiDefault"}
                className="w-full sm:w-56 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-gray-100"
              >
                {availableProviders.length ? (
                  availableProviders.map((prov) => (
                    <option key={prov.key} value={prov.key}>
                      {prov.label}
                    </option>
                  ))
                ) : (
                  <option value="">
                    No active AI providers
                  </option>
                )}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: skeletonCount }).map((_, idx) => (
              <IntegrationCardPlaceholder key={`placeholder-${idx}`} />
            ))}
          </div>
        ) : (
          <Fragment>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
            <p className="mt-6 text-xs text-gray-500">
              Tip: click any card to review or update its credentials. You can
              deactivate an integration at any time without losing stored
              configuration.
            </p>
          </Fragment>
        )}
      </div>

      {/* Pop Modals */}
      {showChatGPTModal && (
        <ChatGPTModal
          initialData={settings.chatgpt}
          onSave={(data) => saveSection('chatgpt', data)}
          onClose={() => setShowChatGPTModal(false)}
        />
      )}
      {showDeepSeekModal && (
        <DeepSeekModal
          initialData={settings.deepseek}
          onSave={(data) => saveSection('deepseek', data)}
          onClose={() => setShowDeepSeekModal(false)}
        />
      )}
      {showGeminiModal && (
        <GeminiModal
          initialData={settings.gemini}
          onSave={(data) => saveSection('gemini', data)}
          onClose={() => setShowGeminiModal(false)}
        />
      )}
      {showGoogleAnalyticsModal && (
        <GoogleAnalyticsModal
          initialData={settings.googleAnalytics}
          onSave={(data) => saveSection('googleAnalytics', data)}
          onClose={() => setShowGoogleAnalyticsModal(false)}
        />
      )}
      {showGoogleAdSenseModal && (
        <GoogleAdSenseModal
          initialData={settings.googleAdSense}
          onSave={(data) => saveSection('googleAdSense', data)}
          onClose={() => setShowGoogleAdSenseModal(false)}
        />
      )}
      {showGoogleAdsModal && (
        <GoogleAdsModal
          initialData={settings.googleAds}
          onSave={(data) => saveSection('googleAds', data)}
          onClose={() => setShowGoogleAdsModal(false)}
        />
      )}
    </AdminLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
