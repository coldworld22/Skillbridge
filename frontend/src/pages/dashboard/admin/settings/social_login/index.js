import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { toast } from "react-toastify";
import { FaToggleOn, FaToggleOff, FaGoogle, FaFacebookF, FaApple, FaGithub } from "react-icons/fa";
import { fetchSocialLoginConfig, updateSocialLoginConfig } from "@/services/admin/socialLoginConfigService";

const availableIcons = {
  google: <FaGoogle />,
  facebook: <FaFacebookF />,
  apple: <FaApple />,
  github: <FaGithub />,
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

  const toggleGlobal = () => {
    const newState = !globalActive;
    setGlobalActive(newState);
    setProviders((prev) =>
      prev.map((p) => ({
        ...p,
        active: newState && providerHasCredentials(p),
      }))
    );
  };
  const toggleRecaptcha = () => setRecaptchaActive(!recaptchaActive);

  const toggleProvider = (index) => {
    setProviders((prev) => {
      const updated = [...prev];
      updated[index].active = !updated[index].active;
      return updated;
    });
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
    // ensure providers with credentials default to active unless explicitly disabled
    const adjusted = providers.map((p) => ({
      ...p,
      active: p.active || providerHasCredentials(p),
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
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save settings");
    }
  };

  const handleProviderSave = async (index) => {
    const adjusted = providers.map((p) => ({
      ...p,
      active: p.active || providerHasCredentials(p),
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
      toast.success(`${providers[index].name} settings saved`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save settings");
    }
  };


  const getDefaultRedirectUrl = (key) => {
    let base = process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;
    base = base.replace(/\/$/, '');
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
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Social Login Settings</h1>

        {/* Global Toggle */}
        <div className="mb-6 flex items-center justify-between p-4 bg-gray-100 rounded">
          <span className="text-lg font-medium">Enable Social Login</span>
          <button onClick={toggleGlobal} className="text-2xl">
            {globalActive ? <FaToggleOn className="text-green-500" /> : <FaToggleOff className="text-gray-400" />}
          </button>
        </div>

        {/* Social Providers */}
        <div className="grid md:grid-cols-2 gap-4">
          {providers.map((provider, index) => (
            <div key={provider.key} className="border p-4 rounded shadow-sm bg-white">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {customIcons[provider.key] ? (
                    <img src={customIcons[provider.key]} alt="custom icon" className="w-5 h-5" />
                  ) : (
                    availableIcons[provider.icon]
                  )} {provider.name}
                </h2>
                <button onClick={() => toggleProvider(index)} className="text-2xl">
                  {provider.active ? <FaToggleOn className="text-yellow-500" /> : <FaToggleOff className="text-yellow-400" />}
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium">Button Label</label>
                  <input
                    type="text"
                    className="w-full border rounded p-2"
                    value={provider.label}
                    onChange={(e) => handleChange(index, "label", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Select Icon</label>
                  <select
                    className="w-full border rounded p-2"
                    value={provider.icon}
                    onChange={(e) => handleChange(index, "icon", e.target.value)}
                  >
                    {Object.keys(availableIcons).map((key) => (
                      <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Or Upload Custom Icon (SVG/PNG)</label>
                  <input
                    type="file"
                    accept="image/svg+xml,image/png"
                    onChange={(e) => handleIconUpload(e, provider.key)}
                  />
                </div>
                {provider.key === "apple" ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium">Client ID</label>
                      <input
                        type="text"
                        className="w-full border rounded p-2"
                        value={provider.clientId}
                        onChange={(e) => handleChange(index, "clientId", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Team ID</label>
                      <input
                        type="text"
                        className="w-full border rounded p-2"
                        value={provider.teamId}
                        onChange={(e) => handleChange(index, "teamId", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Key ID</label>
                      <input
                        type="text"
                        className="w-full border rounded p-2"
                        value={provider.keyId}
                        onChange={(e) => handleChange(index, "keyId", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Private Key</label>
                      <textarea
                        rows={4}
                        className="w-full border rounded p-2"
                        value={provider.privateKey}
                        onChange={(e) => handleChange(index, "privateKey", e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium">Client ID</label>
                      <input
                        type="text"
                        className="w-full border rounded p-2"
                        value={provider.clientId}
                        onChange={(e) => handleChange(index, "clientId", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Client Secret</label>
                      <input
                        type="text"
                        className="w-full border rounded p-2"
                        value={provider.clientSecret}
                        onChange={(e) => handleChange(index, "clientSecret", e.target.value)}
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium">Redirect URL</label>
                  <input
                    type="text"
                    className="w-full border rounded p-2"
                    value={provider.redirectUrl}
                    onChange={(e) => handleChange(index, "redirectUrl", e.target.value)}
                    placeholder={getDefaultRedirectUrl(provider.key)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default: <code>{getDefaultRedirectUrl(provider.key)}</code>{" "}
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(getRedirectUrl(provider))}
                      className="ml-2 text-blue-600 underline"
                    >
                      Copy
                    </button>
                  </p>
                </div>
              </div>

              {provider.active && (
                (provider.key === "apple"
                  ? !provider.clientId || !provider.teamId || !provider.keyId || !provider.privateKey
                  : !provider.clientId || !provider.clientSecret)
              ) && (
                <p className="mt-2 text-sm text-red-500">⚠️ Missing credentials</p>
              )}
              <div className="mt-4 text-right">
                <button
                  className="bg-yellow-500 text-gray-900 px-4 py-1 rounded shadow hover:bg-yellow-600 transition"
                  onClick={() => handleProviderSave(index)}
                >
                  Save {provider.name}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Recaptcha Settings */}
        <h2 className="text-xl font-bold mt-10 mb-4">reCAPTCHA Settings</h2>
        <div className="mb-4 flex items-center justify-between p-4 bg-gray-100 rounded">
          <span className="text-lg font-medium">Enable reCAPTCHA</span>
          <button onClick={toggleRecaptcha} className="text-2xl">
            {recaptchaActive ? <FaToggleOn className="text-green-500" /> : <FaToggleOff className="text-gray-400" />}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Site Key</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={recaptchaSiteKey}
              onChange={(e) => setRecaptchaSiteKey(e.target.value)}
              disabled={!recaptchaActive}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Secret Key</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={recaptchaSecretKey}
              onChange={(e) => setRecaptchaSecretKey(e.target.value)}
              disabled={!recaptchaActive}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8">
          <button
            className="bg-yellow-500 text-gray-900 px-6 py-2 rounded shadow hover:bg-yellow-600 transition"
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
