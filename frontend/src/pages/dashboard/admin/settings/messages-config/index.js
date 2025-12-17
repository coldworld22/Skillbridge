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
import styles from "../settings.module.scss";

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

const REQUIRED_GATEWAY_FIELDS = ["name", "apiKey", "senderId", "region"];
const REQUIRED_OTP_FIELDS = ["name", "apiKey", "region"];
const isEmptyField = (value) =>
  typeof value === "string" ? value.trim().length === 0 : !value;

const ensureGatewayConstraints = (list) => {
  const cloned = Array.isArray(list)
    ? list.map((provider) => ({ ...provider }))
    : [];
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

    if (!provider.active && provider.isDefault) {
      provider.isDefault = false;
    }

    if (provider.active) {
      if (!activeFound) {
        activeFound = true;
      } else {
        provider.active = false;
        provider.isDefault = false;
      }
    }

    if (provider.isDefault) {
      if (!defaultFound) {
        defaultFound = true;
      } else {
        provider.isDefault = false;
      }
    }
  });

  return cloned;
};

const normalizeProvidersList = (list, meta) => {
  const cloned = ensureGatewayConstraints(list);
  const seenIds = new Set();
  let idConflicts = false;

  const normalized = cloned.map((provider) => {
    const normalizedProvider = {
      ...provider,
      name: provider.name?.trim() ?? "",
      apiKey: provider.apiKey?.trim() ?? "",
      region: provider.region?.trim() ?? "",
    };

    let providerId = normalizedProvider.id;
    if (!providerId || seenIds.has(providerId)) {
      providerId = generateProviderId();
      idConflicts = true;
    }
    normalizedProvider.id = providerId;
    seenIds.add(providerId);

    if (provider.type === "Gateway") {
      normalizedProvider.senderId = provider.senderId?.trim() ?? "";
      normalizedProvider.isDefault = !!provider.isDefault;
      normalizedProvider.active = !!provider.active;
    } else {
      delete normalizedProvider.senderId;
      delete normalizedProvider.isDefault;
      delete normalizedProvider.active;
    }

    return normalizedProvider;
  });

  if (meta) {
    meta.hadIdConflicts = idConflicts;
  }

  return normalized;
};

const validateProviders = (providers, t) => {
  const source = Array.isArray(providers) ? providers : [];
  const gatewayIssues = source.filter(
    (provider) =>
      provider.type === "Gateway" &&
      provider.active &&
      REQUIRED_GATEWAY_FIELDS.some((field) => isEmptyField(provider[field]))
  );

  const otpIssues = source.filter(
    (provider) =>
      provider.type === "OTP SDK" &&
      REQUIRED_OTP_FIELDS.some((field) => isEmptyField(provider[field]))
  );

  const messages = [];
  if (gatewayIssues.length) {
    messages.push(t("messagesConfigPage.gateway_validation_error"));
  }
  if (otpIssues.length) {
    messages.push(t("messagesConfigPage.otp_validation_error"));
  }

  return {
    isValid: messages.length === 0,
    message:
      messages.join(" ") || t("messagesConfigPage.validation_error_generic"),
  };
};

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
  const [idWarning, setIdWarning] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchMessagesConfig();
        if (!mounted) return;

        const incoming = Array.isArray(data?.providers) ? data.providers : [];
        const normalizationMeta = {};
        const normalized = incoming.length
          ? normalizeProvidersList(incoming, normalizationMeta)
          : [];
        setProviders(normalized);
        setIdWarning(
          (prev) => prev || Boolean(normalizationMeta.hadIdConflicts)
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
  const otpProviders = useMemo(
    () => providers.filter((provider) => provider.type === "OTP SDK"),
    [providers]
  );

  const handleProviderChange = (id, key, value) => {
    setFormError("");
    setProviders((prev) =>
      prev.map((provider) =>
        provider.id === id ? { ...provider, [key]: value } : provider
      )
    );
  };

  const toggleActive = (id) => {
    setFormError("");
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
            isDefault: nextActive ? true : false,
          };
        }

        return { ...provider, active: false, isDefault: false };
      });

      return normalizeProvidersList(next);
    });
  };

  const setDefault = (id) => {
    setFormError("");
    setProviders((prev) => {
      const next = prev.map((provider) => {
        if (provider.type !== "Gateway") {
          return provider;
        }

        if (provider.id === id) {
          return { ...provider, isDefault: true, active: true };
        }

        return { ...provider, isDefault: false, active: false };
      });

      return normalizeProvidersList(next);
    });
  };

  const addProvider = (type) => {
    setFormError("");
    setProviders((prev) => {
      const next = [
        ...prev,
        type === "Gateway" ? createGatewayProvider() : createOtpProvider(),
      ];
      return normalizeProvidersList(next);
    });
  };

  const removeProvider = (id) => {
    setFormError("");
    setProviders((prev) =>
      normalizeProvidersList(prev.filter((provider) => provider.id !== id))
    );
  };

  const handleSave = async () => {
    setFormError("");
    const validation = validateProviders(providers, t);
    if (!validation.isValid) {
      setFormError(validation.message);
      toast.error(validation.message);
      return;
    }

    setSaving(true);
    try {
      const normalizationMeta = {};
      const normalized = normalizeProvidersList(providers, normalizationMeta);
      const payload = buildPayload(normalized);
      await updateMessagesConfig({ providers: payload });
      setIdWarning(
        (prev) => prev || Boolean(normalizationMeta.hadIdConflicts)
      );
      setProviders(normalized);
      toast.success(t("settings_saved"), { theme: "colored" });
    } catch (err) {
      const message =
        err?.response?.data?.message || t("settings_save_failed");
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t("messagesConfigPage.title")}</h1>
          <p className={styles.subtitle}>{t("messagesConfigPage.subtitle")}</p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => addProvider("Gateway")}
            className={styles.buttonSecondary}
            disabled={saving}
          >
            <FaPlus /> {t("messagesConfigPage.add_gateway_provider")}
          </button>
          <button
            type="button"
            onClick={() => addProvider("OTP SDK")}
            className={styles.buttonSecondary}
            disabled={saving || otpProviders.length >= 1}
            title={
              otpProviders.length >= 1
                ? t("messagesConfigPage.otp_provider_singleton_hint")
                : undefined
            }
          >
            <FaPlus /> {t("messagesConfigPage.add_otp_provider")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={styles.buttonPrimary}
            disabled={saving}
          >
            <FaSave />
            {saving
              ? t("messagesConfigPage.saving_state")
              : t("messagesConfigPage.save_changes")}
          </button>
        </div>
      </div>

      {idWarning && (
        <div className={`${styles.card} ${styles.noticeCard}`}>
          {t("messagesConfigPage.id_issue_warning")}
        </div>
      )}

      {formError && (
        <div className={`${styles.card} ${styles.errorCard}`}>
          {formError}
        </div>
      )}

      {loading ? (
        <div className={styles.card} style={{ borderStyle: "dashed", textAlign: "center" }}>
          {t("messagesConfigPage.loading_state")}
        </div>
      ) : (
        <>
          {providers.length === 0 && (
            <div className={styles.card} style={{ textAlign: "center" }}>
              <h2 className={styles.cardTitle}>
                {t("messagesConfigPage.empty_state_title")}
              </h2>
              <p className={styles.mutedText}>
                {t("messagesConfigPage.empty_state_description")}
              </p>
            </div>
          )}

          <section className={styles.sectionSpacing}>
            <h2 className={styles.cardTitle}>
              📩 {t("messagesConfigPage.sms_providers")}
            </h2>

            {smsProviders.length === 0 ? (
              <p className={`${styles.card} ${styles.mutedText}`}>
                {t("messagesConfigPage.no_sms_providers")}
              </p>
            ) : (
              smsProviders.map((provider) => (
                <div key={provider.id} className={styles.card}>
                  <div className={styles.inlineCard} style={{ alignItems: "flex-start", gap: "0.75rem" }}>
                    <div className={styles.field} style={{ flex: 1 }}>
                      <label className={styles.label}>
                        {t("messagesConfigPage.provider_name")}
                      </label>
                      <input
                        type="text"
                        className={styles.input}
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
                      className={`${styles.buttonSecondary} ${styles.textDanger}`}
                      disabled={saving}
                    >
                      <FaTrash /> {t("messagesConfigPage.remove_provider")}
                    </button>
                  </div>

                  <div className={styles.gridTwo}>
                    <div className={styles.field}>
                      <label className={styles.label}>
                        {t("messagesConfigPage.api_key")}
                      </label>
                      <input
                        type="text"
                        className={styles.input}
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
                      <p className={styles.mutedText}>
                        {t("messagesConfigPage.no_app_prefix")}
                      </p>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>
                        {t("messagesConfigPage.sender_id")}
                      </label>
                      <input
                        type="text"
                        className={styles.input}
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
                    <div className={styles.field}>
                      <label className={styles.label}>
                        {t("messagesConfigPage.region")}
                      </label>
                      <input
                        type="text"
                        className={styles.input}
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

                  <div className={styles.inlineCard} style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <label className={styles.checkboxRow}>
                      <input
                        type="radio"
                        name="defaultGateway"
                        checked={provider.isDefault}
                        onChange={() => setDefault(provider.id)}
                        disabled={saving}
                      />
                      <span className={styles.label}>{t("messagesConfigPage.default_provider")}</span>
                    </label>
                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={provider.active}
                        onChange={() => toggleActive(provider.id)}
                        disabled={saving}
                      />
                      <span className={styles.label}>{t("messagesConfigPage.active_provider")}</span>
                    </label>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className={styles.sectionSpacing}>
            <h2 className={styles.cardTitle}>
              🔐 {t("messagesConfigPage.otp_providers")}
            </h2>

            {otpProviders.length === 0 ? (
              <p className={`${styles.card} ${styles.mutedText}`}>
                {t("messagesConfigPage.no_otp_providers")}
              </p>
            ) : (
              otpProviders.map((provider) => (
                <div key={provider.id} className={styles.card}>
                  <div className={styles.inlineCard} style={{ alignItems: "flex-start", gap: "0.75rem" }}>
                    <div className={styles.field} style={{ flex: 1 }}>
                      <label className={styles.label}>
                        {t("messagesConfigPage.provider_name")}
                      </label>
                      <input
                        type="text"
                        className={styles.input}
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
                      className={`${styles.buttonSecondary} ${styles.textDanger}`}
                      disabled={saving}
                    >
                      <FaTrash /> {t("messagesConfigPage.remove_provider")}
                    </button>
                  </div>

                  <div className={styles.gridTwo}>
                    <div className={styles.field}>
                      <label className={styles.label}>
                        {t("messagesConfigPage.api_key")}
                      </label>
                      <input
                        type="text"
                        className={styles.input}
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
                      <p className={styles.mutedText}>
                        {t("messagesConfigPage.no_app_prefix")}
                      </p>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>
                        {t("messagesConfigPage.region")}
                      </label>
                      <input
                        type="text"
                        className={styles.input}
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
                </div>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}

const ProtectedMessageServiceConfig = withAuthProtection(MessageServiceConfig, {
  permissions: ["manage_notifications"],
});

export default ProtectedMessageServiceConfig;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
