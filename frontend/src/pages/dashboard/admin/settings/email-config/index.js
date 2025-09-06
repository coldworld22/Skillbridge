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
      <div className="max-w-3xl mx-auto px-6 py-10 bg-white shadow-xl rounded-lg dark:bg-gray-900">
        <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          📧 {t('emailConfigPage.title')}
        </h2>

        <div className="space-y-12">

          {/* Sender Details */}
          <section className="form-section">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">{t('emailConfigPage.sender_details')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <section className="form-section">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">{t('emailConfigPage.smtp_settings')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <section className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
            <button
              onClick={sendTestEmail}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-5 py-2 rounded-xl shadow transition-base flex items-center gap-2 disabled:opacity-50"
              disabled={loading}
            >
              <FaEnvelopeOpenText />
              {loading ? t('emailConfigPage.send_test_email_loading') : t('emailConfigPage.send_test_email')}
            </button>
            <button
              onClick={handleSave}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-5 py-2 rounded-xl shadow transition-base flex items-center gap-2"
            >
              <FaSave /> {loading ? t('emailConfigPage.save_settings_loading') : t('emailConfigPage.save_settings')}
            </button>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
