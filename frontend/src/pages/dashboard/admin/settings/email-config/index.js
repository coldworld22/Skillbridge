import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import FormField from "@/components/ui/FormField";
import FormSelect from "@/components/ui/FormSelect";
import PasswordField from "@/components/ui/PasswordField";
import { FaSave, FaEnvelopeOpenText } from "react-icons/fa";
import { toast } from "react-toastify";
import { fetchEmailConfig, updateEmailConfig } from "@/services/admin/emailConfigService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import styles from "../settings.module.scss";

const defaultConfig = {
  fromName: "SkillBridge Admin",
  fromEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  replyTo: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  encryption: "TLS",
  username: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  password: "",
  method: "smtp",
};

export default function EmailConfigPage() {
  const { t } = useTranslation('dashboard');
  const [form, setForm] = useState(defaultConfig);

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchEmailConfig();
        if (data) setForm({ ...defaultConfig, ...data });
      } catch (err) {
        toast.error(t('settings_load_failed'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateEmailConfig(form);
      toast.success(t('emailConfigPage.settings_saved'), { theme: 'colored' });
    } catch (err) {
      toast.error(t('settings_save_failed'));
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = () => {
    setLoading(true);
    toast.info(t('emailConfigPage.test_email_sending'));
    setTimeout(() => {
      setLoading(false);
      toast.success(t('emailConfigPage.test_email_sent'), { theme: 'colored' });
    }, 1000);
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <h2 className={styles.title} style={{ marginBottom: "1rem" }}>
          📧 {t('emailConfigPage.title')}
        </h2>

        <div className={styles.stack}>

          {/* Sender Details */}
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>{t('emailConfigPage.sender_details')}</h3>
            <div className={styles.gridTwo}>
              <FormField
                name="fromName"
                label={t('emailConfigPage.from_name')}
                value={form.fromName}
                onChange={handleChange}
              />
              <FormField
                name="fromEmail"
                label={t('emailConfigPage.from_email')}
                type="email"
                value={form.fromEmail}
                onChange={handleChange}
              />
              <FormField
                name="replyTo"
                label={t('emailConfigPage.reply_to_email')}
                type="email"
                value={form.replyTo}
                onChange={handleChange}
              />
            </div>
          </section>

          {/* SMTP Settings */}
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>{t('emailConfigPage.smtp_settings')}</h3>
            <div className={styles.gridTwo}>
              <FormField
                name="smtpHost"
                label={t('emailConfigPage.smtp_host')}
                value={form.smtpHost}
                onChange={handleChange}
              />
              <FormField
                name="smtpPort"
                label={t('emailConfigPage.smtp_port')}
                type="number"
                value={form.smtpPort}
                onChange={handleChange}
              />
              <FormSelect
                name="encryption"
                label={t('emailConfigPage.encryption')}
                value={form.encryption}
                onChange={handleChange}
                options={[
                  { label: "None", value: "None" },
                  { label: "SSL", value: "SSL" },
                  { label: "TLS", value: "TLS" },
                ]}
              />
              <FormSelect
                name="method"
                label={t('emailConfigPage.sending_method')}
                value={form.method}
                onChange={handleChange}
                options={[
                  { label: "SMTP", value: "smtp" },
                  { label: "PHP mail()", value: "mail" },
                ]}
              />
              <FormField
                name="username"
                label={t('emailConfigPage.smtp_username')}
                value={form.username}
                onChange={handleChange}
              />
              <PasswordField
                name="password"
                label={t('emailConfigPage.smtp_password')}
                value={form.password}
                onChange={handleChange}
              />
            </div>
          </section>

          {/* Actions */}
          <section className={styles.inlineCard} style={{ justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={sendTestEmail}
              className={styles.buttonSecondary}
              disabled={loading}
            >
              <FaEnvelopeOpenText />
              {loading ? t('emailConfigPage.send_test_email_loading') : t('emailConfigPage.send_test_email')}
            </button>
            <button
              onClick={handleSave}
              className={styles.buttonPrimary}
            >
              <FaSave /> {loading ? t('emailConfigPage.save_settings_loading') : t('emailConfigPage.save_settings')}
            </button>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
