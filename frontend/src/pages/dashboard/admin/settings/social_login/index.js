import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { toast } from "react-toastify";
import { FaToggleOn, FaToggleOff, FaGoogle, FaFacebookF, FaApple, FaGithub } from "react-icons/fa";
import { fetchSocialLoginConfig, updateSocialLoginConfig } from "@/services/admin/socialLoginConfigService";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import styles from "../settings.module.scss";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

const availableIcons = {
  google: <FaGoogle />,
  facebook: <FaFacebookF />,
  apple: <FaApple />,
  github: <FaGithub />,
};

const useAdminNotice = () => {
  const user = useAuthStore((state) => state.user);
  const refreshNotifications = useNotificationStore((state) => state.fetch);
  const refreshMessages = useMessageStore((state) => state.fetch);
  return async (type, message) => {
    try {
      await createNotification({ user_id: user.id, type, message });
      await sendChatMessage(user.id, { text: message });
      refreshNotifications?.();
      refreshMessages?.();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to send notification";
      toast.error(msg);
    }
  };
};

const initialProviders = [
  {
    name: "Google",
    key: "google",
    active: false,
    clientId: "",
    clientSecret: "",
    redirectUrl: "",
    label: "Sign in with Google",
    icon: "google"
  },
  {
    name: "Facebook",
    key: "facebook",
    active: false,
    clientId: "",
    clientSecret: "",
    redirectUrl: "",
    label: "Sign in with Facebook",
    icon: "facebook"
  },
  {
    name: "Apple",
    key: "apple",
    active: false,
    clientId: "",
    teamId: "",
    keyId: "",
    privateKey: "",
    redirectUrl: "",
    label: "Sign in with Apple",
    icon: "apple"
  },
  {
    name: "GitHub",
    key: "github",
    active: false,
    clientId: "",
    clientSecret: "",
    redirectUrl: "",
    label: "Sign in with GitHub",
    icon: "github"
  }
];

const providerHasCredentials = (p) => {
  if (p.key === "apple") {
    return p.clientId && p.teamId && p.keyId && p.privateKey;
  }
  return p.clientId && p.clientSecret;
};

export default function SocialLoginSettingsPage() {
  const [globalActive, setGlobalActive] = useState(true);
  const [providers, setProviders] = useState(initialProviders);
  const [recaptchaActive, setRecaptchaActive] = useState(true);
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState("");
  const [recaptchaSecretKey, setRecaptchaSecretKey] = useState("");
  const [customIcons, setCustomIcons] = useState({});
  const notify = useAdminNotice();
  const { t, i18n } = useTranslation('dashboard', { keyPrefix: 'socialLoginSettingsPage' });

  const getCurrentState = () => ({
    globalActive,
    providers: providers.map((p) => ({ ...p })),
    recaptchaActive,
    recaptchaSiteKey,
    recaptchaSecretKey,
  });

  const restoreState = (state) => {
    setGlobalActive(state.globalActive);
    setProviders(state.providers);
    setRecaptchaActive(state.recaptchaActive);
    setRecaptchaSiteKey(state.recaptchaSiteKey);
    setRecaptchaSecretKey(state.recaptchaSecretKey);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const cfg = await fetchSocialLoginConfig();
        if (!cfg) return;
        setGlobalActive(!!cfg.enabled);
        if (cfg.providers) {
          setProviders((prev) =>
            prev.map((p) => {
              const saved = cfg.providers[p.key] || {};
              return {
                ...p,
                active:
                  saved.active !== undefined
                    ? saved.active
                    : providerHasCredentials(saved),
                clientId: saved.clientId || "",
                clientSecret: saved.clientSecret || "",
                teamId: saved.teamId || "",
                keyId: saved.keyId || "",
                privateKey: saved.privateKey || "",
                redirectUrl: saved.redirectUrl || "",
                label: saved.label || p.label,
                icon: saved.icon || p.icon,
              };
            })
          );
        }
        setRecaptchaActive(!!cfg.recaptcha?.active);
        setRecaptchaSiteKey(cfg.recaptcha?.siteKey || "");
        setRecaptchaSecretKey(cfg.recaptcha?.secretKey || "");
      } catch (err) {
        console.error("Failed to load social login config", err);
      }
    };
    load();
  }, []);

  const toggleGlobal = async () => {
    const prevState = getCurrentState();
    const newState = !globalActive;
    const updatedProviders = providers.map((p) => ({
      ...p,
      active: newState && providerHasCredentials(p),
    }));
    setGlobalActive(newState);
    setProviders(updatedProviders);
    const payload = {
      enabled: newState,
      providers: updatedProviders.reduce((acc, p) => {
        acc[p.key] = {
          active: p.active,
          clientId: p.clientId,
          clientSecret: p.clientSecret,
          teamId: p.teamId,
          keyId: p.keyId,
          privateKey: p.privateKey,
          redirectUrl: p.redirectUrl,
          label: p.label,
          icon: p.icon,
        };
        return acc;
      }, {}),
      recaptcha: {
        active: recaptchaActive,
        siteKey: recaptchaSiteKey,
        secretKey: recaptchaSecretKey,
      },
    };
    try {
      await updateSocialLoginConfig(payload);
      toast.success(t(newState ? 'social_login_enabled' : 'social_login_disabled'));
      notify(
        "social_login_settings_updated",
        t(newState ? 'social_login_enabled' : 'social_login_disabled')
      );
    } catch (err) {
      restoreState(prevState);
      toast.error(err?.response?.data?.message || t('update_failed'));
    }
  };
  const toggleRecaptcha = () => setRecaptchaActive(!recaptchaActive);

  const toggleProvider = async (index) => {
    const prevState = getCurrentState();
    const updated = providers.map((p, i) =>
      i === index ? { ...p, active: !p.active } : p
    );
    setProviders(updated);
    const adjusted = updated.map((p) => ({
      ...p,
      active: p.active && providerHasCredentials(p),
    }));
    const payload = {
      enabled: globalActive,
      providers: adjusted.reduce((acc, p) => {
        acc[p.key] = {
          active: p.active,
          clientId: p.clientId,
          clientSecret: p.clientSecret,
          teamId: p.teamId,
          keyId: p.keyId,
          privateKey: p.privateKey,
          redirectUrl: p.redirectUrl,
          label: p.label,
          icon: p.icon,
        };
        return acc;
      }, {}),
      recaptcha: {
        active: recaptchaActive,
        siteKey: recaptchaSiteKey,
        secretKey: recaptchaSecretKey,
      },
    };
    try {
      await updateSocialLoginConfig(payload);
      setProviders(adjusted);
      const status = adjusted[index].active
        ? t('provider_enabled', { name: adjusted[index].name })
        : t('provider_disabled', { name: adjusted[index].name });
      toast.success(status);
      notify("social_provider_updated", status);
    } catch (err) {
      restoreState(prevState);
      toast.error(err?.response?.data?.message || t('update_failed'));
    }
  };

  const handleChange = (index, field, value) => {
    const updated = [...providers];
    updated[index][field] = value;
    setProviders(updated);
  };

  const handleIconUpload = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomIcons((prev) => ({ ...prev, [key]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const prevState = getCurrentState();
    // ensure providers are only active when toggled on and have required credentials
    const adjusted = providers.map((p) => ({
      ...p,
      active: p.active && providerHasCredentials(p),
    }));

    const payload = {
      enabled: globalActive,
      providers: adjusted.reduce((acc, p) => {
        acc[p.key] = {
          active: p.active,
          clientId: p.clientId,
          clientSecret: p.clientSecret,
          teamId: p.teamId,
          keyId: p.keyId,
          privateKey: p.privateKey,
          redirectUrl: p.redirectUrl,
          label: p.label,
          icon: p.icon,
        };
        return acc;
      }, {}),
      recaptcha: {
        active: recaptchaActive,
        siteKey: recaptchaSiteKey,
        secretKey: recaptchaSecretKey,
      },
    };
    try {
      await updateSocialLoginConfig(payload);
      setProviders(adjusted);
      toast.success(t('settings_saved'));
      notify("social_login_settings_updated", t('settings_updated'));
    } catch (err) {
      restoreState(prevState);
      toast.error(err?.response?.data?.message || t('settings_save_failed'));
    }
  };

  const handleProviderSave = async (index) => {
    const prevState = getCurrentState();
    const adjusted = providers.map((p) => ({
      ...p,
      active: p.active && providerHasCredentials(p),
    }));
    const payload = {
      enabled: globalActive,
      providers: adjusted.reduce((acc, p) => {
        acc[p.key] = {
          active: p.active,
          clientId: p.clientId,
          clientSecret: p.clientSecret,
          teamId: p.teamId,
          keyId: p.keyId,
          privateKey: p.privateKey,
          redirectUrl: p.redirectUrl,
          label: p.label,
          icon: p.icon,
        };
        return acc;
      }, {}),
      recaptcha: {
        active: recaptchaActive,
        siteKey: recaptchaSiteKey,
        secretKey: recaptchaSecretKey,
      },
    };
    try {
      await updateSocialLoginConfig(payload);
      setProviders(adjusted);
      toast.success(t('provider_settings_saved', { name: providers[index].name }));
      notify(
        "social_provider_updated",
        t('provider_settings_updated', { name: providers[index].name })
      );
    } catch (err) {
      restoreState(prevState);
      toast.error(err?.response?.data?.message || t('settings_save_failed'));
    }
  };


  const getDefaultRedirectUrl = (key) => {
    let base = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!base && typeof window !== 'undefined') {
      base = window.location.origin;
    }
    base = (base || '').replace(/\/$/, '');
    if (base.endsWith('/api')) {
      base = base.slice(0, -4);
    }
    return `${base}/api/auth/${key}/callback`;

  };

  const getRedirectUrl = (provider) => {
    if (typeof provider === 'string') return getDefaultRedirectUrl(provider);
    return provider.redirectUrl || getDefaultRedirectUrl(provider.key);
  };


  return (
    <AdminLayout title={t('title')}>
      <div className={styles.page} dir={i18n.dir()}>
        <div className={styles.sectionHeader}>
          <h1 className={styles.title}>{t('title')}</h1>
        </div>

        <div className={`${styles.card} ${styles.inlineCard}`}>
          <div>
            <p className={styles.cardTitle}>{t('enable_social_login')}</p>
          </div>
          <button
            onClick={toggleGlobal}
            className={`${styles.iconButton} ${globalActive ? styles.textSuccess : styles.textMuted}`}
            aria-pressed={globalActive}
          >
            {globalActive ? <FaToggleOn /> : <FaToggleOff />}
          </button>
        </div>

        <div className={styles.providerGrid}>
          {providers.map((provider, index) => (
            <div key={provider.key} className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  {customIcons[provider.key] ? (
                    <img src={customIcons[provider.key]} alt="custom icon" className={styles.iconThumb} />
                  ) : (
                    availableIcons[provider.icon]
                  )}{" "}
                  {provider.name}
                </h2>
                <button
                  onClick={() => toggleProvider(index)}
                  className={`${styles.iconButton} ${provider.active ? styles.textWarning : styles.textMuted}`}
                  aria-pressed={provider.active}
                >
                  {provider.active ? <FaToggleOn /> : <FaToggleOff />}
                </button>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.field}>
                  <label className={styles.label}>{t('button_label')}</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={provider.label}
                    onChange={(e) => handleChange(index, "label", e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>{t('select_icon')}</label>
                  <select
                    className={styles.select}
                    value={provider.icon}
                    onChange={(e) => handleChange(index, "icon", e.target.value)}
                  >
                    {Object.keys(availableIcons).map((key) => (
                      <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>{t('upload_custom_icon')}</label>
                  <input
                    type="file"
                    accept="image/svg+xml,image/png"
                    onChange={(e) => handleIconUpload(e, provider.key)}
                    className={styles.input}
                  />
                </div>
                {provider.key === "apple" ? (
                  <>
                    <div className={styles.field}>
                      <label className={styles.label}>{t('client_id')}</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={provider.clientId}
                        onChange={(e) => handleChange(index, "clientId", e.target.value)}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>{t('team_id')}</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={provider.teamId}
                        onChange={(e) => handleChange(index, "teamId", e.target.value)}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>{t('key_id')}</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={provider.keyId}
                        onChange={(e) => handleChange(index, "keyId", e.target.value)}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>{t('private_key')}</label>
                      <textarea
                        rows={4}
                        className={styles.textarea}
                        value={provider.privateKey}
                        onChange={(e) => handleChange(index, "privateKey", e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.field}>
                      <label className={styles.label}>{t('client_id')}</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={provider.clientId}
                        onChange={(e) => handleChange(index, "clientId", e.target.value)}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>{t('client_secret')}</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={provider.clientSecret}
                        onChange={(e) => handleChange(index, "clientSecret", e.target.value)}
                      />
                    </div>
                  </>
                )}
                <div className={styles.field}>
                  <label className={styles.label}>{t('redirect_url')}</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={provider.redirectUrl}
                    onChange={(e) => handleChange(index, "redirectUrl", e.target.value)}
                    placeholder={getDefaultRedirectUrl(provider.key)}
                  />
                </div>
              </div>

              {provider.active && (
                (provider.key === "apple"
                  ? !provider.clientId || !provider.teamId || !provider.keyId || !provider.privateKey
                  : !provider.clientId || !provider.clientSecret)
              ) && (
                <p className={styles.helperText}>{t('missing_credentials')}</p>
              )}
              <div className={styles.actionsRight}>
                <button
                  className={styles.buttonPrimary}
                  onClick={() => handleProviderSave(index)}
                >
                  {t('save_provider', { name: provider.name })}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.sectionSpacing}>
          <h2 className={styles.sectionTitle}>{t('recaptcha_settings')}</h2>
          <div className={`${styles.card} ${styles.inlineCard}`}>
            <span className={styles.cardTitle}>{t('enable_recaptcha')}</span>
            <button
              onClick={toggleRecaptcha}
              className={`${styles.iconButton} ${recaptchaActive ? styles.textSuccess : styles.textMuted}`}
              aria-pressed={recaptchaActive}
            >
              {recaptchaActive ? <FaToggleOn /> : <FaToggleOff />}
            </button>
          </div>

          <div className={styles.gridTwo}>
            <div className={styles.field}>
              <label className={styles.label}>{t('site_key')}</label>
              <input
                type="text"
                className={styles.input}
                value={recaptchaSiteKey}
                onChange={(e) => setRecaptchaSiteKey(e.target.value)}
                disabled={!recaptchaActive}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('secret_key')}</label>
              <input
                type="text"
                className={styles.input}
                value={recaptchaSecretKey}
                onChange={(e) => setRecaptchaSecretKey(e.target.value)}
                disabled={!recaptchaActive}
              />
            </div>
          </div>
        </div>

        <div className={styles.actionsRight}>
          <button
            className={styles.buttonPrimary}
            onClick={handleSave}
          >
            {t('save_changes')}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
