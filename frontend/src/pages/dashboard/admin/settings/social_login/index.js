import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaToggleOn, FaToggleOff, FaGoogle, FaFacebookF, FaGithub, FaLinkedin, FaApple } from "react-icons/fa";

const availableIcons = {
  google: <FaGoogle />,
  facebook: <FaFacebookF />,
  github: <FaGithub />,
  linkedin: <FaLinkedin />,
  apple: <FaApple />,
};

const initialProviders = [
  {
    name: "Google",
    key: "google",
    active: true,
    clientId: "",
    clientSecret: "",
    label: "Sign in with Google",
    icon: "google"
  },
  {
    name: "Facebook",
    key: "facebook",
    active: false,
    clientId: "",
    clientSecret: "",
    label: "Sign in with Facebook",
    icon: "facebook"
  },
  {
    name: "GitHub",
    key: "github",
    active: false,
    clientId: "",
    clientSecret: "",
    label: "Sign in with GitHub",
    icon: "github"
  },
  {
    name: "LinkedIn",
    key: "linkedin",
    active: false,
    clientId: "",
    clientSecret: "",
    label: "Sign in with LinkedIn",
    icon: "linkedin"
  },
  {
    name: "Apple",
    key: "apple",
    active: false,
    clientId: "",
    clientSecret: "",
    label: "Sign in with Apple",
    icon: "apple"
  }
];

export default function SocialLoginSettingsPage() {
  const [globalActive, setGlobalActive] = useState(true);
  const [providers, setProviders] = useState(initialProviders);
  const [recaptchaActive, setRecaptchaActive] = useState(true);
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState("");
  const [recaptchaSecretKey, setRecaptchaSecretKey] = useState("");
  const [customIcons, setCustomIcons] = useState({});

  const toggleGlobal = () => setGlobalActive(!globalActive);
  const toggleRecaptcha = () => setRecaptchaActive(!recaptchaActive);

  const toggleProvider = (index) => {
    const updated = [...providers];
    updated[index].active = !updated[index].active;
    setProviders(updated);
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

  const getRedirectUrl = (key) => `https://yourdomain.com/api/auth/${key}/callback`;

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
                    disabled={!provider.active}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Select Icon</label>
                  <select
                    className="w-full border rounded p-2"
                    value={provider.icon}
                    onChange={(e) => handleChange(index, "icon", e.target.value)}
                    disabled={!provider.active}
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
                    disabled={!provider.active}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Client ID</label>
                  <input
                    type="text"
                    className="w-full border rounded p-2"
                    value={provider.clientId}
                    onChange={(e) => handleChange(index, "clientId", e.target.value)}
                    disabled={!provider.active}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Client Secret</label>
                  <input
                    type="text"
                    className="w-full border rounded p-2"
                    value={provider.clientSecret}
                    onChange={(e) => handleChange(index, "clientSecret", e.target.value)}
                    disabled={!provider.active}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Redirect URL: <code>{getRedirectUrl(provider.key)}</code></p>
              </div>

              {provider.active && (!provider.clientId || !provider.clientSecret) && (
                <p className="mt-2 text-sm text-red-500">⚠️ Missing credentials</p>
              )}
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
            onClick={() => console.log({ globalActive, providers, recaptchaActive, recaptchaSiteKey, recaptchaSecretKey })}
          >
            Save Changes
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
