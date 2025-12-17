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
import Link from "next/link";
import styles from "../settings.module.scss";

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
    <div className={styles.page} dir={i18n.dir()}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <img src="/logo-icon.png" alt="Logo" width={24} height={24} /> {t('create_title')}
        </h1>
        <Link href="/dashboard/admin/settings/currency" className={styles.buttonSecondary}>
          <FaArrowLeft /> {t('back')}
        </Link>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>{t('currency_name')}</label>
          <input
            type="text"
            name="label"
            value={form.label}
            onChange={handleChange}
            placeholder={t('currency_name_placeholder')}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('currency_code')}</label>
          <input
            type="text"
            name="code"
            value={form.code}
            onChange={handleChange}
            placeholder={t('currency_code_placeholder')}
            required
            className={styles.input}
          />
          {form.code && (
            <img
              src={`https://flagcdn.com/24x18/${form.code.slice(0, 2).toLowerCase()}.png`}
              onError={(e) => (e.target.src = "/flags/default.png")}
              alt="Flag preview"
              className={styles.flag}
            />
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('symbol_label')}</label>
          <input
            type="text"
            name="symbol"
            value={form.symbol}
            onChange={handleChange}
            placeholder="e.g. $"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.gridTwo}>
          <div className={styles.field}>
            <label className={styles.label}>{t('exchange_rate')}</label>
            <input
              type="number"
              name="exchange_rate"
              value={form.exchange_rate}
              onChange={handleChange}
              min="0.0001"
              step="0.0001"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('tax_rate')}</label>
            <input
              type="number"
              name="tax_rate"
              value={form.tax_rate}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('currency_logo')}</label>
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
            className={styles.input}
          />
          {preview && (
            <div className={styles.previewWrapper}>
              <img src={preview} alt="Logo preview" className={styles.previewImage} />
            </div>
          )}
        </div>

        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            <span className={styles.label}>{t('active')}</span>
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              name="auto_update"
              checked={form.auto_update}
              onChange={handleChange}
            />
            <span className={styles.label}>{t('auto_update_rate')}</span>
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              name="is_default"
              checked={form.is_default}
              onChange={handleChange}
            />
            <span className={styles.label}>{t('set_as_default')}</span>
          </label>
        </div>

        <button type="submit" className={styles.buttonPrimary}>
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

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
