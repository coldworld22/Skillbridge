import AdminLayout from "@/components/layouts/AdminLayout";
import { useRouter } from "next/router";
import { useState } from "react";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import { createMethod } from "@/services/admin/paymentMethodService";
import { useTranslation } from "next-i18next";
import { toast } from "react-toastify";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import styles from "../payments.module.scss";

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

export default function CreatePaymentMethodPage() {
  const router = useRouter();
  const { t } = useTranslation('dashboard');
  const [form, setForm] = useState({
    name: "",
    type: "Gateway",
    active: true,
    is_default: false,
    settings: {},
    settingsText: "{}",
  });
  const [iconFile, setIconFile] = useState(null);
  const notify = useAdminNotice();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "settings") {
      setForm((prev) => ({ ...prev, settingsText: value }));
    } else if (name === "icon") {
      setIconFile(e.target.files[0] || null);
    } else {
      setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let settings = {};
      try {
        settings = form.settingsText ? JSON.parse(form.settingsText) : {};
        } catch (err) {
          toast.error(t('paymentsPage.invalid_json'));
          return;
        }
      let payload;
      if (iconFile) {
        payload = new FormData();
        payload.append('name', form.name);
        payload.append('type', form.type);
        payload.append('icon', iconFile);
        payload.append('active', form.active);
        payload.append('is_default', form.is_default);
        payload.append('settings', JSON.stringify(settings));
      } else {
        payload = {
          name: form.name,
          type: form.type,
          active: form.active,
          is_default: form.is_default,
          settings,
        };
      }
      await createMethod(payload);
      toast.success(t('method_saved'));
      const message = `Payment method "${form.name}" created.`;
      notify('payment_method_created', message);
      router.push("/dashboard/admin/payments");
    } catch (err) {
      console.error("Failed to create method", err);
      const msg = err.response?.data?.message || t('failed_to_save_method');
      toast.error(msg);
    }
  };

  return (
    <AdminLayout title={t('add_payment_method')}>
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h1 className={styles.cardTitle}>{t('add_payment_method')}</h1>
              <p className={styles.cardSubtitle}>
                {t('paymentsPage.add_method_subtitle', 'Create a new payment option for your platform.')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className={styles.secondaryButton}
            >
              <FaArrowLeft /> {t('back')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.section}>
            <div className={styles.section}>
              <label className={styles.cardTitle}>{t('name')}</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder={t('paymentsPage.method_name_placeholder')}
              />
            </div>

            <div className={styles.section}>
              <label className={styles.cardTitle}>{t('type')}</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="Gateway">Gateway</option>
                <option value="Manual">Manual</option>
                <option value="Crypto">Crypto</option>
              </select>
            </div>

            <div className={styles.section}>
              <label className={styles.cardTitle}>{t('icon')}</label>
              <input
                type="file"
                name="icon"
                accept="image/*"
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            <div className={styles.section}>
              <label className={styles.cardTitle}>{t('settings')}</label>
              <textarea
                name="settings"
                rows={5}
                value={form.settingsText}
                onChange={handleChange}
                className={`${styles.textarea} ${styles.mono}`}
              />
            </div>

            <label className={styles.inlineCheckbox}>
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
              />
              <span>{t('active')}</span>
            </label>
            <label className={styles.inlineCheckbox}>
              <input
                type="checkbox"
                name="is_default"
                checked={form.is_default}
                onChange={handleChange}
              />
              <span>{t('default_method')}</span>
            </label>

            <div className={styles.actionRow}>
              <button
                type="submit"
                className={styles.accentButton}
              >
                <FaSave /> {t('save_method')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'dashboard'], nextI18NextConfig)),
    },
  };
}
