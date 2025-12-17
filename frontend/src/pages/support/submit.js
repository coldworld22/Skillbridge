import { useState } from "react";
import { createTicket } from "@/services/supportService";
import { toast } from "react-toastify";
import PageHead from "@/components/common/PageHead";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import AdminLayout from "@/components/layouts/AdminLayout";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import StudentLayout from "@/components/layouts/StudentLayout";
import useAuthStore from "@/store/auth/authStore";
import useSupportTranslation from "@/hooks/useSupportTranslation";
import styles from "./support.module.scss";

// ─────────────────────
// 🎟️ Submit ticket page
// ─────────────────────
export default function SubmitTicketPage() {
  const { t } = useSupportTranslation();
  const user = useAuthStore((state) => state.user);
  const [form, setForm] = useState({
    subject: "",
    category: "",
    priority: "Medium",
    message: "",
    attachment: null,
  });

  const layoutMap = {
    admin: AdminLayout,
    instructor: InstructorLayout,
    student: StudentLayout,
  };

  const DefaultLayout = ({ children }) => (
    <div className={styles.shell}>
      <Navbar />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );

  const Layout = layoutMap[user?.role?.toLowerCase?.()] || DefaultLayout;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ─────────────────────
  // 🚀 Submit form handler
  // ─────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await createTicket({
        subject: form.subject,
        message: form.message,
      });
      toast.success(
        t('ticket_submitted_number', { number: data.ticket_number })
      );
      setForm({ subject: '', category: '', priority: 'Medium', message: '', attachment: null });
    } catch (err) {
      console.error('Failed to submit ticket', err);
    }
  };

  return (
    <Layout>
      <PageHead title={t('submit_ticket')} />
      <div className={styles.content}>
        <h1 className={styles.formTitle}>{t('submit_ticket')}</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>{t('subject')}</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('category')}</label>
            <select
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
              required
              className={styles.select}
            >
              <option value="">{t('select_category')}</option>
              <option value="billing">{t('billing_payments')}</option>
              <option value="technical">{t('technical_issue')}</option>
              <option value="classes">{t('online_classes')}</option>
              <option value="other">{t('other')}</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('priority')}</label>
            <select
              value={form.priority}
              onChange={(e) => handleChange("priority", e.target.value)}
              className={styles.select}
            >
              <option value="Low">{t('low')}</option>
              <option value="Medium">{t('medium')}</option>
              <option value="High">{t('high')}</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('message')}</label>
            <textarea
              value={form.message}
              onChange={(e) => handleChange("message", e.target.value)}
              rows={6}
              required
              className={styles.textarea}
            ></textarea>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('attachment_optional')}</label>
            <input
              type="file"
              onChange={(e) => handleChange("attachment", e.target.files[0])}
              className={styles.file}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.primaryButton}
            >
              {t('submit_ticket')}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'dashboard'], nextI18NextConfig)),
    },
  };
}
