import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import {
  fetchMethodById,
  updateMethod,
  fetchPayPalCredentials,
  updatePayPalCredentials,
  fetchStripeSettings,
  updateStripeSettings,
  fetchCoinbaseSettings,
  updateCoinbaseSettings,
} from "@/services/admin/paymentMethodService";
import { toast } from "react-toastify";
import useAdminNotice from "@/hooks/useAdminNotice";

export default function PaymentProviderConfig({ providerId }) {
  const [settings, setSettings] = useState("{}");
  const [form, setForm] = useState({});
  const [mode, setMode] = useState("generic");
  const [loading, setLoading] = useState(true);
  const [hasStoredPayPalSecret, setHasStoredPayPalSecret] = useState(false);
  const notify = useAdminNotice();
  const { t } = useTranslation('dashboard');

  useEffect(() => {
    if (!providerId) return;
    const load = async () => {
      try {
        if (providerId === 'paypal') {
          const creds = await fetchPayPalCredentials();
          setForm({
            client_id: creds.client_id || '',
            client_secret: '',
            mode: creds.mode || 'sandbox',
          });
          setHasStoredPayPalSecret(Boolean(creds.has_client_secret));
          setMode('paypal');
        } else if (providerId === 'stripe') {
          const creds = await fetchStripeSettings();
          setForm({
            publishable_key: creds.publishable_key || '',
            secret_key: '',
          });
          setHasStoredPayPalSecret(false);
          setMode('stripe');
        } else if (providerId === 'coinbase') {
          const creds = await fetchCoinbaseSettings();
          setForm({
            api_key: creds.api_key || '',
            api_secret: '',
          });
          setHasStoredPayPalSecret(false);
          setMode('coinbase');
        } else {
          const method = await fetchMethodById(providerId);
          setSettings(JSON.stringify(method?.settings || {}, null, 2));
          setHasStoredPayPalSecret(false);
          setMode('generic');
        }
      } catch (err) {
        console.error("Failed to load method", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [providerId]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      if (mode === 'paypal') {
        const payload = {};
        if (form.client_id?.trim()) payload.client_id = form.client_id.trim();
        if (form.client_secret?.trim()) payload.client_secret = form.client_secret.trim();
        if (form.mode) payload.mode = form.mode;

        const updated = await updatePayPalCredentials(payload);
        setForm((prev) => ({
          client_id: updated?.client_id ?? prev.client_id,
          client_secret: '',
          mode: updated?.mode ?? prev.mode,
        }));
        setHasStoredPayPalSecret(Boolean(updated?.has_client_secret));
      } else if (mode === 'stripe') {
        const payload = {
          publishable_key: form.publishable_key || "",
        };
        if (form.secret_key?.trim()) {
          payload.secret_key = form.secret_key.trim();
        }
        const updated = await updateStripeSettings(payload);
        setForm((prev) => ({
          publishable_key: updated?.publishable_key ?? prev.publishable_key,
          secret_key: "",
        }));
      } else if (mode === 'coinbase') {
        const payload = {
          api_key: form.api_key || "",
        };
        if (form.api_secret?.trim()) {
          payload.api_secret = form.api_secret.trim();
        }
        const updated = await updateCoinbaseSettings(payload);
        setForm((prev) => ({
          api_key: updated?.api_key ?? prev.api_key,
          api_secret: "",
        }));
      } else {
        let parsed;
        try {
          parsed = settings ? JSON.parse(settings) : {};
        } catch (err) {
          if (err instanceof SyntaxError) {
            toast.error(t('paymentsPage.invalid_json'));
            return;
          }
          throw err;
        }
        await updateMethod(providerId, { settings: parsed });
      }
      toast.success(t('paymentsPage.config_saved'));
      notify(
        "payment_method_updated",
        `Payment method \"${providerId}\" configuration updated`
      );
    } catch (err) {
      console.error("Failed to save settings", err);
      toast.error(t('paymentsPage.config_save_failed'));
    }
  };

  if (loading) return <p>{t('common:loading')}</p>;

  if (mode === 'paypal') {
    return (
      <form onSubmit={handleSave} className="space-y-4 bg-white p-6 rounded-xl shadow">
        <div>
          <label className="block text-sm font-medium">{t('client_id')}</label>
          <input
            type="text"
            name="client_id"
            value={form.client_id}
            onChange={handleFieldChange}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">{t('client_secret')}</label>
          <input
            type="password"
            name="client_secret"
            value={form.client_secret}
            onChange={handleFieldChange}
            className="w-full border rounded p-2"
            autoComplete="new-password"
          />
          {hasStoredPayPalSecret && !form.client_secret && (
            <p className="mt-1 text-xs text-gray-500">
              {t('paymentsPage.paypal_secret_hint')}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium">Mode</label>
          <select
            name="mode"
            value={form.mode}
            onChange={handleFieldChange}
            className="w-full border rounded p-2"
          >
            <option value="sandbox">Sandbox</option>
            <option value="live">Live</option>
          </select>
        </div>
        <button type="submit" className="bg-yellow-400 px-6 py-2 rounded-full text-white">
          {t('paymentsPage.save_configuration')}
        </button>
      </form>
    );
  }

  if (mode === 'stripe') {
    return (
      <form onSubmit={handleSave} className="space-y-4 bg-white p-6 rounded-xl shadow">
        <div>
          <label className="block text-sm font-medium">Publishable Key</label>
          <input
            type="text"
            name="publishable_key"
            value={form.publishable_key}
            onChange={handleFieldChange}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Secret Key</label>
          <input
            type="text"
            name="secret_key"
            value={form.secret_key}
            onChange={handleFieldChange}
            className="w-full border rounded p-2"
          />
        </div>
        <button type="submit" className="bg-yellow-400 px-6 py-2 rounded-full text-white">
          {t('paymentsPage.save_configuration')}
        </button>
      </form>
    );
  }

  if (mode === 'coinbase') {
    return (
      <form onSubmit={handleSave} className="space-y-4 bg-white p-6 rounded-xl shadow">
        <div>
          <label className="block text-sm font-medium">API Key</label>
          <input
            type="text"
            name="api_key"
            value={form.api_key}
            onChange={handleFieldChange}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">API Secret</label>
          <input
            type="text"
            name="api_secret"
            value={form.api_secret}
            onChange={handleFieldChange}
            className="w-full border rounded p-2"
          />
        </div>
        <button type="submit" className="bg-yellow-400 px-6 py-2 rounded-full text-white">
          {t('paymentsPage.save_configuration')}
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-4 bg-white p-6 rounded-xl shadow"
    >
      <label className="block text-sm font-medium">{t('settings')}</label>
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
        {t('paymentsPage.save_configuration')}
      </button>
    </form>
  );
}
