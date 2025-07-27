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
import { useTranslation } from "next-i18next";

// ─────────────────────
// 🎟️ Submit ticket page
// ─────────────────────
export default function SubmitTicketPage() {
  const { t } = useTranslation('dashboard');
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
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">{children}</main>
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
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('submit_ticket')}</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-1 text-sm">{t('subject')}</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              required
              className="w-full bg-white border border-gray-300 rounded px-4 py-2"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">{t('category')}</label>
            <select
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
              required
              className="w-full bg-white border border-gray-300 rounded px-4 py-2"
            >
              <option value="">{t('select_category')}</option>
              <option value="billing">{t('billing_payments')}</option>
              <option value="technical">{t('technical_issue')}</option>
              <option value="classes">{t('online_classes')}</option>
              <option value="other">{t('other')}</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm">{t('priority')}</label>
            <select
              value={form.priority}
              onChange={(e) => handleChange("priority", e.target.value)}
              className="w-full bg-white border border-gray-300 rounded px-4 py-2"
            >
              <option value="Low">{t('low')}</option>
              <option value="Medium">{t('medium')}</option>
              <option value="High">{t('high')}</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm">{t('message')}</label>
            <textarea
              value={form.message}
              onChange={(e) => handleChange("message", e.target.value)}
              rows={6}
              required
              className="w-full bg-white border border-gray-300 rounded px-4 py-2"
            ></textarea>
          </div>

          <div>
            <label className="block mb-1 text-sm">{t('attachment_optional')}</label>
            <input
              type="file"
              onChange={(e) => handleChange("attachment", e.target.files[0])}
              className="block w-full text-sm text-gray-700"
            />
          </div>

          <button
            type="submit"
            className="bg-yellow-500 text-black px-6 py-2 rounded hover:bg-yellow-600 transition"
          >
            {t('submit_ticket')}
          </button>
        </form>
      </div>
    </Layout>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'dashboard'], nextI18NextConfig)),
    },
  };
}
