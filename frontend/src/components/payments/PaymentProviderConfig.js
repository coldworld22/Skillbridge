import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import {
  fetchMethodById,
  updateMethod,
} from "@/services/admin/paymentMethodService";
import { toast } from "react-toastify";
import useAdminNotice from "@/hooks/useAdminNotice";

export default function PaymentProviderConfig({ providerId }) {
  const [settings, setSettings] = useState("{}");
  const [loading, setLoading] = useState(true);
  const notify = useAdminNotice();
  const { t } = useTranslation('dashboard');

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

    let parsed;
    try {
      parsed = settings ? JSON.parse(settings) : {};
    } catch (err) {
      if (err instanceof SyntaxError) {
        toast.error("Invalid JSON format");
        return;
      }
      throw err;
    }

    try {
      await updateMethod(providerId, { settings: parsed });
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
