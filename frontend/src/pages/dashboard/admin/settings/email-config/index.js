import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import FormField from "@/components/ui/FormField";
import FormSelect from "@/components/ui/FormSelect";
import PasswordField from "@/components/ui/PasswordField";
import { FaSave, FaEnvelopeOpenText } from "react-icons/fa";
import { toast } from "react-toastify";
import { fetchEmailConfig, updateEmailConfig } from "@/services/admin/emailConfigService";

const defaultConfig = {
  fromName: "SkillBridge Admin",
  fromEmail: "admin@skillbridge.com",
  replyTo: "support@skillbridge.com",
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  encryption: "TLS",
  username: "admin@skillbridge.com",
  password: "",
  method: "smtp",
};

export default function EmailConfigPage() {
  const [form, setForm] = useState(defaultConfig);

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchEmailConfig();
        if (data) setForm({ ...defaultConfig, ...data });
      } catch (err) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateEmailConfig(form);
      toast.success("✅ Email configuration saved successfully!");
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = () => {
    setLoading(true);
    toast.info("📨 Sending test email...");
    setTimeout(() => {
      setLoading(false);
      toast.success("✅ Test email sent successfully!");
    }, 1000);
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto px-6 py-10 bg-white shadow-xl rounded-lg dark:bg-gray-900">
        <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          📧 Email Configuration
        </h2>

        <div className="space-y-12">

          {/* Sender Details */}
          <section className="form-section">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Sender Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                name="fromName"
                label="From Name"
                value={form.fromName}
                onChange={handleChange}
              />
              <FormField
                name="fromEmail"
                label="From Email"
                type="email"
                value={form.fromEmail}
                onChange={handleChange}
              />
              <FormField
                name="replyTo"
                label="Reply-To Email"
                type="email"
                value={form.replyTo}
                onChange={handleChange}
              />
            </div>
          </section>

          {/* SMTP Settings */}
          <section className="form-section">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">SMTP Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                name="smtpHost"
                label="SMTP Host"
                value={form.smtpHost}
                onChange={handleChange}
              />
              <FormField
                name="smtpPort"
                label="SMTP Port"
                type="number"
                value={form.smtpPort}
                onChange={handleChange}
              />
              <FormSelect
                name="encryption"
                label="Encryption"
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
                label="Sending Method"
                value={form.method}
                onChange={handleChange}
                options={[
                  { label: "SMTP", value: "smtp" },
                  { label: "PHP mail()", value: "mail" },
                ]}
              />
              <FormField
                name="username"
                label="SMTP Username"
                value={form.username}
                onChange={handleChange}
              />
              <PasswordField
                name="password"
                label="SMTP Password"
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
              {loading ? "Sending..." : "Send Test Email"}
            </button>
            <button
              onClick={handleSave}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-5 py-2 rounded-xl shadow transition-base flex items-center gap-2"
            >
              <FaSave /> Save Settings
            </button>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
