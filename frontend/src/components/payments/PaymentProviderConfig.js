import { useEffect, useState } from "react";
import {
  fetchMethodById,
  updateMethod,
} from "@/services/admin/paymentMethodService";
import { toast } from "react-toastify";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";

const useAdminNotice = () => {
  const user = useAuthStore((s) => s.user);
  const refreshNotifications = useNotificationStore((s) => s.fetch);
  const refreshMessages = useMessageStore((s) => s.fetch);
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

export default function PaymentProviderConfig({ providerId }) {
  const [settings, setSettings] = useState("{}");
  const [loading, setLoading] = useState(true);
  const notify = useAdminNotice();

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
      toast.success("Configuration saved");
      notify("payment_method_updated", `Payment method \"${providerId}\" configuration updated`);
    } catch (err) {
      console.error("Failed to save settings", err);
      toast.error("Failed to save configuration");
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
