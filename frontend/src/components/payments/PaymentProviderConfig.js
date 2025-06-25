import { useEffect, useState } from "react";
import {
  fetchMethodById,
  updateMethod,
} from "@/services/admin/paymentMethodService";

export default function PaymentProviderConfig({ providerId }) {
  const [settings, setSettings] = useState("{}");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!providerId) return;
    const load = async () => {
      try {
        const method = await fetchMethodById(providerId);
        setSettings(JSON.stringify(method?.settings || {}, null, 2));
      } catch (err) {
        console.error("Failed to load method", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [providerId]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const parsed = settings ? JSON.parse(settings) : {};
      await updateMethod(providerId, { settings: parsed });
      alert("Configuration saved");
    } catch (err) {
      console.error("Failed to save settings", err);
      alert("Failed to save configuration");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <form
      onSubmit={handleSave}
      className="space-y-4 bg-white p-6 rounded-xl shadow"
    >
      <label className="block text-sm font-medium">Settings (JSON)</label>
      <textarea
        className="w-full border rounded p-2 font-mono text-sm"
        rows={10}
        value={settings}
        onChange={(e) => setSettings(e.target.value)}
      />
      <button
        type="submit"
        className="bg-yellow-400 px-6 py-2 rounded-full text-white"
      >
        Save Configuration
      </button>
    </form>
  );
}
