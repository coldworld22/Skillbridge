import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaToggleOn, FaToggleOff, FaSave, FaPlus, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import withAuthProtection from "@/hooks/withAuthProtection";
import {
  fetchMessagesConfig,
  updateMessagesConfig,
} from "@/services/admin/messagesConfigService";

const generateProviderId = () => {
  const globalCrypto =
    typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID();
  }
  return `provider-${Date.now()}-${Math.random().toString(16).slice(2, 9)}`;
};

const createGatewayProvider = () => ({
  id: generateProviderId(),
  name: "",
  type: "Gateway",
  apiKey: "",
  senderId: "",
  region: "",
  active: false,
  isDefault: false,
});

const createOtpProvider = () => ({
  id: generateProviderId(),
  name: "",
  type: "OTP SDK",
  apiKey: "",
  region: "",
});

const ensureGatewayConstraints = (list) => {
  const cloned = list.map((provider) => ({ ...provider }));
  const gatewayIndexes = cloned.reduce((indexes, provider, index) => {
    if (provider.type === "Gateway") {
      indexes.push(index);
    }
    return indexes;
  }, []);

  if (gatewayIndexes.length === 0) {
    return cloned;
  }

  let defaultFound = false;
  let activeFound = false;

  gatewayIndexes.forEach((index) => {
    const provider = cloned[index];
    provider.isDefault = !!provider.isDefault;
    provider.active = !!provider.active;

    if (provider.isDefault) {
      if (!defaultFound) {
        defaultFound = true;
      } else {
        provider.isDefault = false;
      }
    }

    if (provider.active) {
      if (!activeFound) {
        activeFound = true;
      } else {
        provider.active = false;
      }
    }
  });

  if (!defaultFound) {
    const firstGatewayIndex = gatewayIndexes[0];
    cloned[firstGatewayIndex].isDefault = true;
    cloned[firstGatewayIndex].active = true;
    activeFound = true;
  }

  if (!activeFound) {
    const defaultIndex = gatewayIndexes.find(
      (index) => cloned[index].isDefault
    );
    const indexToActivate =
      defaultIndex !== undefined ? defaultIndex : gatewayIndexes[0];
    cloned[indexToActivate].active = true;
  }

  return cloned;
};

const normalizeProvidersList = (list) =>
  ensureGatewayConstraints(list).map((provider) => {
    const normalized = {
      ...provider,
      name: provider.name?.trim() ?? "",
      apiKey: provider.apiKey?.trim() ?? "",
      region: provider.region?.trim() ?? "",
    };

    if (provider.type === "Gateway") {
      normalized.senderId = provider.senderId?.trim() ?? "";
      normalized.isDefault = !!provider.isDefault;
      normalized.active = !!provider.active;
    } else {
      delete normalized.senderId;
      delete normalized.isDefault;
      delete normalized.active;
    }

    return normalized;
  });

const buildPayload = (list) =>
  list.map((provider) => {
    const payload = {
      id: provider.id,
      name: provider.name,
      type: provider.type,
      apiKey: provider.apiKey,
      region: provider.region,
    };

    if (provider.type === "Gateway") {
      payload.senderId = provider.senderId || "";
      payload.active = !!provider.active;
      payload.isDefault = !!provider.isDefault;
    }

    return payload;
  });

function MessageServiceConfig() {
  const { t } = useTranslation("dashboard");
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchMessagesConfig();
        if (!mounted) return;

        const incoming = Array.isArray(data?.providers) ? data.providers : [];
        setProviders(
          incoming.length ? normalizeProvidersList(incoming) : []
        );
      } catch (err) {
        if (mounted) {
          toast.error(t("settings_load_failed"));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [t]);

  const smsProviders = useMemo(
    () => providers.filter((provider) => provider.type === "Gateway"),
    [providers]
  );
  const otpProvider = useMemo(
    () => providers.find((provider) => provider.type === "OTP SDK"),
    [providers]
  );

  const handleProviderChange = (id, key, value) => {
    setProviders((prev) =>
      prev.map((provider) =>
        provider.id === id ? { ...provider, [key]: value } : provider
      )
    );
  };

  const toggleActive = (id) => {
    setProviders((prev) => {
      const next = prev.map((provider) => {
        if (provider.type !== "Gateway") {
          return provider;
        }

        if (provider.id === id) {
          const nextActive = !provider.active;
          return {
            ...provider,
            active: nextActive,
            isDefault: nextActive ? true : provider.isDefault,
          };
        }

        return { ...provider, active: false };
      });

      return normalizeProvidersList(next);
    });
  };

  const setDefault = (id) => {
    setProviders((prev) => {
      const next = prev.map((provider) => {
        if (provider.type !== "Gateway") {
          return provider;
        }

        if (provider.id === id) {
          return { ...provider, isDefault: true, active: true };
        }

        return { ...provider, isDefault: false };
      });

      return normalizeProvidersList(next);
    });
  };

  const addProvider = (type) => {
    setProviders((prev) => {
      const next = [
        ...prev,
        type === "Gateway" ? createGatewayProvider() : createOtpProvider(),
      ];
      return normalizeProvidersList(next);
    });
  };

  const removeProvider = (id) => {
    setProviders((prev) =>
      normalizeProvidersList(prev.filter((provider) => provider.id !== id))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const normalized = normalizeProvidersList(providers);
      const payload = buildPayload(normalized);
      await updateMessagesConfig({ providers: payload });
      setProviders(normalized);
      toast.success(t("settings_saved"), { theme: "colored" });
    } catch (err) {
      toast.error(t("settings_save_failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">
        {t("messagesConfigPage.title")}
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        {t("messagesConfigPage.subtitle")}
      </p>

      <div className="flex flex-wrap gap-3 mb-8">
        <button
          type="button"
          onClick={() => addProvider("Gateway")}
          className="flex items-center gap-2 rounded bg-blue-100 px-4 py-2 text-blue-800 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
        >
          <FaPlus /> {t("messagesConfigPage.add_gateway_provider")}
        </button>
        <button
          type="button"
          onClick={() => addProvider("OTP SDK")}
          className="flex items-center gap-2 rounded bg-purple-100 px-4 py-2 text-purple-800 transition hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving || Boolean(otpProvider)}
          title={
            otpProvider
              ? t("messagesConfigPage.otp_provider_singleton_hint")
              : undefined
          }
        >
          <FaPlus /> {t("messagesConfigPage.add_otp_provider")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={saving}
        >
          <FaSave />
          {saving
            ? t("messagesConfigPage.saving_state")
            : t("messagesConfigPage.save_changes")}
        </button>
      </div>

      {loading ? (
        <div className="rounded border border-dashed border-gray-300 bg-white/60 p-6 text-center text-gray-500 shadow-sm dark:bg-gray-900/60 dark:text-gray-400">
          {t("messagesConfigPage.loading_state")}
        </div>
      ) : (
        <>
          {providers.length === 0 && (
            <div className="rounded border border-dashed border-gray-300 bg-white/60 p-6 text-center text-gray-500 shadow-sm dark:bg-gray-900/60 dark:text-gray-400">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                {t("messagesConfigPage.empty_state_title")}
              </h2>
              <p className="mt-2 text-sm">
                {t("messagesConfigPage.empty_state_description")}
              </p>
            </div>
          )}

          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">
              📩 {t("messagesConfigPage.sms_providers")}
            </h2>

            {smsProviders.length === 0 ? (
              <p className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                {t("messagesConfigPage.no_sms_providers")}
              </p>
            ) : (
              smsProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="mb-6 space-y-4 rounded border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="sm:flex-1">
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        {t("messagesConfigPage.provider_name")}
                      </label>
                      <input
                        type="text"
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        value={provider.name}
                        onChange={(e) =>
                          handleProviderChange(
                            provider.id,
                            "name",
                            e.target.value
                          )
                        }
                        disabled={saving}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProvider(provider.id)}
                      className="inline-flex items-center gap-2 self-start rounded border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-400/10"
                      disabled={saving}
                    >
                      <FaTrash /> {t("messagesConfigPage.remove_provider")}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        {t("messagesConfigPage.api_key")}
                      </label>
                      <input
                        type="text"
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        value={provider.apiKey}
                        onChange={(e) =>
                          handleProviderChange(
                            provider.id,
                            "apiKey",
                            e.target.value
                          )
                        }
                        disabled={saving}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {t("messagesConfigPage.no_app_prefix")}
                      </p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        {t("messagesConfigPage.sender_id")}
                      </label>
                      <input
                        type="text"
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        value={provider.senderId}
                        onChange={(e) =>
                          handleProviderChange(
                            provider.id,
                            "senderId",
                            e.target.value
                          )
                        }
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        {t("messagesConfigPage.region")}
                      </label>
                      <input
                        type="text"
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        value={provider.region}
                        onChange={(e) =>
                          handleProviderChange(
                            provider.id,
                            "region",
                            e.target.value
                          )
                        }
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                      <input
                        type="radio"
                        name="defaultGateway"
                        checked={provider.isDefault}
                        onChange={() => setDefault(provider.id)}
                        disabled={saving}
                      />
                      {t("messagesConfigPage.default")}
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleActive(provider.id)}
                      className={`inline-flex items-center gap-2 text-sm font-semibold transition focus:outline-none ${
                        provider.active
                          ? "text-green-600 hover:text-green-700"
                          : "text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                      disabled={saving}
                    >
                      {provider.active ? <FaToggleOn /> : <FaToggleOff />}
                      {provider.active
                        ? t("messagesConfigPage.status_active")
                        : t("messagesConfigPage.status_inactive")}
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-4">
              🔐 {t("messagesConfigPage.otp_provider")}
            </h2>

            {otpProvider ? (
              <div className="space-y-4 rounded border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="sm:flex-1">
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                      {t("messagesConfigPage.provider_name")}
                    </label>
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      value={otpProvider.name}
                      onChange={(e) =>
                        handleProviderChange(otpProvider.id, "name", e.target.value)
                      }
                      disabled={saving}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProvider(otpProvider.id)}
                    className="inline-flex items-center gap-2 self-start rounded border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-400/10"
                    disabled={saving}
                  >
                    <FaTrash /> {t("messagesConfigPage.remove_provider")}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                      {t("messagesConfigPage.api_key")}
                    </label>
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      value={otpProvider.apiKey}
                      onChange={(e) =>
                        handleProviderChange(otpProvider.id, "apiKey", e.target.value)
                      }
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                      {t("messagesConfigPage.region")}
                    </label>
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      value={otpProvider.region}
                      onChange={(e) =>
                        handleProviderChange(otpProvider.id, "region", e.target.value)
                      }
                      disabled={saving}
                    />
                  </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("messagesConfigPage.firebase_hint")}
                </p>
              </div>
            ) : (
              <p className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                {t("messagesConfigPage.no_otp_provider")}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

MessageServiceConfig.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedMessagesConfigPage = withAuthProtection(MessageServiceConfig, [
  "admin",
  "superadmin",
]);

ProtectedMessagesConfigPage.getLayout = MessageServiceConfig.getLayout;

export default ProtectedMessagesConfigPage;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["dashboard"],
        nextI18NextConfig
      )),
    },
  };
}
