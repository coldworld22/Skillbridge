// pages/dashboard/admin/settings/messages-config.js
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaToggleOn, FaToggleOff, FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import { fetchMessagesConfig, updateMessagesConfig } from "@/services/admin/messagesConfigService";

const initialProviders = [
  {
    id: 1,
    name: "Twilio",
    type: "Gateway",
    apiKey: "",
    senderId: "SkillBridge",
    region: "US",
    active: true,
    isDefault: true,
  },
  {
    id: 2,
    name: "MessageBird",
    type: "Gateway",
    apiKey: "",
    senderId: "SkillBridge",
    region: "EU",
    active: false,
    isDefault: false,
  },
  {
    id: 3,
    name: "Infobip",
    type: "Gateway",
    apiKey: "",
    senderId: "SkillBridge",
    region: "US",
    active: false,
    isDefault: false,
  },
  {
    id: 4,
    name: "Firebase Auth",
    type: "OTP SDK",
    apiKey: "",
    senderId: "",
    region: "Global",
    active: true,
    isDefault: false,
  },
];


export default function MessageServiceConfig() {
  const [providers, setProviders] = useState(initialProviders);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchMessagesConfig();
        if (data && Array.isArray(data.providers)) {
          setProviders(data.providers);
        }
      } catch (err) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Separate groups
  const smsProviders = providers.filter(p => p.type === "Gateway");
  const otpProvider = providers.find(p => p.type === "OTP SDK");

  const handleChange = (index, key, value) => {
    const updated = [...providers];
    updated[index][key] = value;
    setProviders(updated);
  };

  const toggleActive = (index) => {
    setProviders((prev) =>
      prev.map((p, i) =>
        p.type === "Gateway"
          ? { ...p, active: i === index ? !p.active : false }
          : p
      )
    );
  };

  const setDefault = (index) => {
    setProviders((prev) =>
      prev.map((p, i) =>
        p.type === "Gateway" ? { ...p, isDefault: i === index } : p
      )
    );
  };

  const handleSaveProvider = (index) => {
    const save = async () => {
      try {
        await updateMessagesConfig({ providers });
        toast.success(`${providers[index].name} settings saved!`, { theme: "colored" });
      } catch (err) {
        toast.error("Failed to save settings");
      }
    };
    save();
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Messaging Providers Configuration</h1>

        {/* --- SMS Providers --- */}
        <h2 className="text-xl font-semibold mb-4">📩 SMS Providers</h2>
        {smsProviders.map((provider, index) => (
          <div key={provider.id} className="border rounded p-4 mb-6 shadow space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{provider.name}</h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={provider.isDefault}
                    onChange={() => setDefault(providers.findIndex(p => p.id === provider.id))}
                  />
                  Default
                </label>
                <button
                  onClick={() => toggleActive(providers.findIndex(p => p.id === provider.id))}
                  className={`text-xl ${provider.active ? "text-green-500" : "text-gray-400"}`}
                >
                  {provider.active ? <FaToggleOn /> : <FaToggleOff />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">API Key</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={provider.apiKey}
                  onChange={(e) =>
                    handleChange(providers.findIndex(p => p.id === provider.id), "apiKey", e.target.value)
                  }
                />
                <p className="text-xs text-gray-500 mt-1">Do not include the <code>App</code> prefix.</p>
              </div>
              <div>
                <label className="block font-medium mb-1">Sender ID</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={provider.senderId}
                  onChange={(e) =>
                    handleChange(providers.findIndex(p => p.id === provider.id), "senderId", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Base URL / Region</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={provider.region}
                  onChange={(e) =>
                    handleChange(providers.findIndex(p => p.id === provider.id), "region", e.target.value)
                  }
                />
              </div>
            </div>
            <button
              onClick={() => handleSaveProvider(providers.findIndex(p => p.id === provider.id))}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
            >
              <FaSave /> Save
            </button>
          </div>
        ))}

        {/* --- OTP Provider --- */}
        {otpProvider && (
          <>
            <h2 className="text-xl font-semibold mb-4 mt-10">🔐 OTP Provider</h2>
            <div className="border rounded p-4 shadow space-y-4">
              <h3 className="text-lg font-semibold">{otpProvider.name}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block font-medium mb-1">API Key</label>
                  <input
                    type="text"
                    className="w-full border rounded p-2"
                    value={otpProvider.apiKey}
                    onChange={(e) =>
                      handleChange(providers.findIndex(p => p.id === otpProvider.id), "apiKey", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Base URL / Region</label>
                  <input
                    type="text"
                    className="w-full border rounded p-2"
                    value={otpProvider.region}
                    onChange={(e) =>
                      handleChange(providers.findIndex(p => p.id === otpProvider.id), "region", e.target.value)
                    }
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Firebase Auth is used for phone number OTP during login. No toggle is required.
              </p>
              <button
                onClick={() => handleSaveProvider(providers.findIndex(p => p.id === otpProvider.id))}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
              >
                <FaSave /> Save
              </button>
            </div>
          </>
        )}

      </div>
    </AdminLayout>
  );
}
