import { useState } from "react";
import { createTicket } from "@/services/supportService";
import { toast } from "react-toastify";
import PageHead from "@/components/common/PageHead";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { useTranslation } from "next-i18next";

export default function SubmitTicketPage() {
  const { t } = useTranslation('dashboard');
  const [form, setForm] = useState({
    subject: "",
    category: "",
    priority: "Medium",
    message: "",
    attachment: null,
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTicket({ subject: form.subject, message: form.message });
      toast.success(t('ticket_submitted'));
      setForm({ subject: "", category: "", priority: "Medium", message: "", attachment: null });
    } catch (err) {
      console.error("Failed to submit ticket", err);
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <PageHead title={t('submit_ticket')} />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold text-yellow-500 mb-6">{t('submit_ticket')}</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-1 text-sm">Subject</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Category</label>
            <select
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2"
            >
              <option value="">Select Category</option>
              <option value="billing">Billing & Payments</option>
              <option value="technical">Technical Issue</option>
              <option value="classes">Online Classes</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => handleChange("priority", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => handleChange("message", e.target.value)}
              rows={6}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2"
            ></textarea>
          </div>

          <div>
            <label className="block mb-1 text-sm">Attachment (optional)</label>
            <input
              type="file"
              onChange={(e) => handleChange("attachment", e.target.files[0])}
              className="block w-full text-sm text-gray-300"
            />
          </div>

          <button
            type="submit"
            className="bg-yellow-500 text-black px-6 py-2 rounded hover:bg-yellow-600 transition"
          >
            Submit Ticket
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
