// ─────────────────────
// Edit currency details. Restricted to admins and super admins.
// ─────────────────────
import AdminLayout from "@/components/layouts/AdminLayout";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import useAdminNotice from "@/hooks/useAdminNotice";
import { fetchCurrencies, updateCurrency } from "@/services/admin/currencyService";
import { useSWRConfig } from "swr";
import Link from "next/link";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import withAuthProtection from "@/hooks/withAuthProtection";
import { useTranslation } from "next-i18next";
import nextI18NextConfig from "../../../../../../../next-i18next.config.js";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { API_BASE_URL } from "@/config/config";
import styles from "../../settings.module.scss";

// React component: edit an existing currency
// ─────────────────────
function EditCurrencyPage() {
  const router = useRouter();
  const { id } = router.query;
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

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const currencies = await fetchCurrencies();
        const cur = currencies.find((c) => c.id === id);
        if (cur) {
          setForm({
            label: cur.label,
            code: cur.code,
            symbol: cur.symbol,
            exchange_rate: cur.exchange_rate,
            tax_rate: cur.tax_rate || 0,
            is_active: cur.is_active,
            auto_update: cur.auto_update,
            is_default: cur.is_default,
          });
          if (cur.logo_url) setPreview(`${API_BASE_URL}${cur.logo_url}`);
        }
      } catch (err) {
        console.error(err);
        toast.error(t('error'));
      }
    };
    load();
  }, [id]);

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
  // Submit the updated currency to the backend
  // ─────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (logoFile) fd.append("logo", logoFile);
    try {
      await updateCurrency(id, fd);
      mutate("/currencies");
      toast.success(t('currency_updated'));
      const message = `Currency "${form.label}" updated.`;
      notify("currency_updated", message);
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
          <img src="/logo-icon.png" alt="Logo" width={24} height={24} /> {t('edit_title')}
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
            required
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('symbol_label')}</label>
          <input
            type="text"
            name="symbol"
            value={form.symbol}
            onChange={handleChange}
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
            <div style={{ marginTop: 8 }}>
              <img src={preview} alt="Logo preview" width={64} height={64} style={{ objectFit: "contain", borderRadius: 8, border: "1px solid #e5e7eb" }} />
            </div>
          )}
        </div>
        <div className={styles.checkboxRow} style={{ flexWrap: "wrap", gap: "0.75rem" }}>
          <label className={styles.checkboxRow}>
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
            <span className={styles.label}>{t('active')}</span>
          </label>
          <label className={styles.checkboxRow}>
            <input type="checkbox" name="auto_update" checked={form.auto_update} onChange={handleChange} />
            <span className={styles.label}>{t('auto_update_rate')}</span>
          </label>
          <label className={styles.checkboxRow}>
            <input type="checkbox" name="is_default" checked={form.is_default} onChange={handleChange} />
            <span className={styles.label}>{t('set_as_default')}</span>
          </label>
        </div>
        <button type="submit" className={styles.buttonPrimary}>
          <FaSave /> {t('update_currency')}
        </button>
      </form>
    </div>
  );
}

EditCurrencyPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedEditCurrencyPage = withAuthProtection(EditCurrencyPage, {
  permissions: ["manage_currencies"],
});
ProtectedEditCurrencyPage.getLayout = EditCurrencyPage.getLayout;
export default ProtectedEditCurrencyPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
