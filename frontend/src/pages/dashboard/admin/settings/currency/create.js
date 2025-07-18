// pages/dashboard/admin/settings/currencies/create.js
import AdminLayout from "@/components/layouts/AdminLayout";
import { useState } from "react";
import { toast } from "react-toastify";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import { useSWRConfig } from "swr";
import { useRouter } from "next/router";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import { createCurrency } from "@/services/admin/currencyService";
import withAuthProtection from "@/hooks/withAuthProtection";

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

function CreateCurrencyPage() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const notify = useAdminNotice();
  const [form, setForm] = useState({
    label: "",
    code: "",
    symbol: "",
    exchange_rate: 1,
    is_active: true,
    auto_update: true,
    is_default: false,
  });
  const [preview, setPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const key = name;
    const newValue =
      key === "code"
        ? value.toUpperCase()
        : type === "checkbox"
        ? checked
        : value;

    setForm((prev) => ({
      ...prev,
      [key]: newValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (logoFile) fd.append("logo", logoFile);
    try {
      await createCurrency(fd);
      mutate("/currencies");
      toast.success("Currency saved!");
      const message = `Currency "${form.label}" created.`;
      notify("currency_created", message);
      router.push("/dashboard/admin/settings/currency");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to save currency.";
      toast.error(msg);
    }
  };

  return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
  <img src="/logo-icon.png" alt="Logo" className="w-6 h-6" /> Add Currency
</h1>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-black"
          >
            <FaArrowLeft /> Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow rounded">
          <div>
            <label className="block font-semibold mb-1">Currency Name</label>
            <input
              type="text"
              name="label"
              value={form.label}
              onChange={handleChange}
              placeholder="e.g. US Dollar"
              required
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Currency Code</label>
            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="e.g. USD"
              required
              className="w-full border p-2 rounded uppercase"
            />
            {form.code && (
              <img
                src={`https://flagcdn.com/24x18/${form.code.slice(0, 2).toLowerCase()}.png`}
                onError={(e) => (e.target.src = "/flags/default.png")}
                alt="Flag preview"
                className="mt-2 w-6 h-4 rounded border"
              />
            )}
          </div>

          <div>
            <label className="block font-semibold mb-1">Symbol</label>
            <input
              type="text"
              name="symbol"
              value={form.symbol}
              onChange={handleChange}
              placeholder="e.g. $"
              required
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Exchange Rate</label>
            <input
              type="number"
              name="exchange_rate"
              value={form.exchange_rate}
              onChange={handleChange}
              min="0.0001"
              step="0.0001"
              required
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
          <label className="block font-semibold mb-1">Currency Logo (optional)</label>
          <input
            type="file"
            name="logo"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              if (!file.type.startsWith("image/")) {
                alert("Only image files are allowed.");
                return;
              }
              if (file.size > 2 * 1024 * 1024) {
                alert("Max file size is 2MB.");
                return;
              }
              const reader = new FileReader();
              reader.onload = (ev) => setPreview(ev.target.result);
              reader.readAsDataURL(file);
              setLogoFile(file);
            }}
            className="w-full border p-2 rounded"
          />
        {preview && (
          <div className="mt-2">
            <img src={preview} alt="Logo preview" className="w-16 h-16 object-contain border rounded" />
          </div>
        )}

        </div>
        <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              <span className="text-sm font-medium">Active</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="auto_update"
                checked={form.auto_update}
                onChange={handleChange}
              />
              <span className="text-sm font-medium">Auto Update Rate</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_default"
                checked={form.is_default}
                onChange={handleChange}
              />
              <span className="text-sm font-medium">Set as Default</span>
            </label>
          </div>

          <button
            type="submit"
            className="bg-yellow-500 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FaSave /> Save Currency
          </button>
        </form>
      </div>
  );
}

CreateCurrencyPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedCreateCurrencyPage = withAuthProtection(CreateCurrencyPage, [
  "admin",
  "superadmin",
]);

ProtectedCreateCurrencyPage.getLayout = CreateCurrencyPage.getLayout;

export default ProtectedCreateCurrencyPage;

