// ─────────────────────
// Page for creating a new currency entry.
// Only accessible to admins and super admins.
// ─────────────────────
import AdminLayout from "@/components/layouts/AdminLayout";
import { useState } from "react";
import { toast } from "react-toastify";
import useAdminNotice from "@/hooks/useAdminNotice";
import { useSWRConfig } from "swr";
import { useRouter } from "next/router";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import { createCurrency } from "@/services/admin/currencyService";
import withAuthProtection from "@/hooks/withAuthProtection";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

// React component: form to create a currency
// ─────────────────────
function CreateCurrencyPage() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const notify = useAdminNotice();
  const { t, i18n } = useTranslation('dashboard', { keyPrefix: 'currenciesPage' });
  const [form, setForm] = useState({
    label: "",
    code: "",
    symbol: "",
    exchange_rate: 1,
    tax_rate: 0,
    is_active: true,
    auto_update: true,
    is_default: false,
  });
  const [preview, setPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  // ─────────────────────
  // Handle form field changes
  // ─────────────────────
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

  // ─────────────────────
  // Submit the form and create the currency
  // ─────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (logoFile) fd.append("logo", logoFile);
    try {
      await createCurrency(fd);
      mutate("/currencies");
      toast.success(t('currency_saved'));
      const message = `Currency "${form.label}" created.`;
      notify("currency_created", message);
      router.push("/dashboard/admin/settings/currency");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || t('failed_to_save');
      toast.error(msg);
    }
  };

  return (
      <div className="p-6 max-w-2xl mx-auto" dir={i18n.dir()}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
  <img src="/logo-icon.png" alt="Logo" className="w-6 h-6" /> {t('create_title')}
</h1>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-black"
          >
            <FaArrowLeft /> {t('back')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow rounded">
          <div>
            <label className="block font-semibold mb-1">{t('currency_name')}</label>
            <input
              type="text"
              name="label"
              value={form.label}
              onChange={handleChange}
              placeholder={t('currency_name_placeholder')}
              required
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('currency_code')}</label>
            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder={t('currency_code_placeholder')}
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
            <label className="block font-semibold mb-1">{t('symbol_label')}</label>
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
            <label className="block font-semibold mb-1">{t('exchange_rate')}</label>
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
            <label className="block font-semibold mb-1">{t('tax_rate')}</label>
            <input
              type="number"
              name="tax_rate"
              value={form.tax_rate}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
          <label className="block font-semibold mb-1">{t('currency_logo')}</label>
          <input
            type="file"
            name="logo"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              if (!file.type.startsWith("image/")) {
                toast.error(t('invalid_image_type'));
                return;
              }
              if (file.size > 2 * 1024 * 1024) {
                toast.error(t('image_too_large'));
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
              <span className="text-sm font-medium">{t('active')}</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="auto_update"
                checked={form.auto_update}
                onChange={handleChange}
              />
              <span className="text-sm font-medium">{t('auto_update_rate')}</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_default"
                checked={form.is_default}
                onChange={handleChange}
              />
              <span className="text-sm font-medium">{t('set_as_default')}</span>
            </label>
          </div>

          <button
            type="submit"
            className="bg-yellow-500 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FaSave /> {t('save_currency')}
          </button>
        </form>
      </div>
  );
}

CreateCurrencyPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedCreateCurrencyPage = withAuthProtection(CreateCurrencyPage, {
  permissions: ["manage_currencies"],
});

ProtectedCreateCurrencyPage.getLayout = CreateCurrencyPage.getLayout;

export default ProtectedCreateCurrencyPage;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
