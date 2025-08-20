import { useRouter } from "next/router";
import PageHead from "@/components/common/PageHead";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import AdminLayout from "@/components/layouts/AdminLayout";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import StudentLayout from "@/components/layouts/StudentLayout";
import useAuthStore from "@/store/auth/authStore";
import { useEffect, useState } from "react";
import { fetchTicketById, addMessage } from "@/services/supportService";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";

export default function TicketDetailPage() {
  const { t } = useTranslation('dashboard');
  const router = useRouter();
  const { id } = router.query;
  const user = useAuthStore((state) => state.user);
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState("");

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

  useEffect(() => {
    if (id) load();
  }, [id]);

  const load = async () => {
    try {
      const data = await fetchTicketById(id);
      setTicket(data);
    } catch (err) {
      console.error("Failed to fetch ticket", err);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    try {
      await addMessage(id, reply);
      setReply("");
      load();
      toast.success(t('reply_sent'));
    } catch (err) {
      console.error("Failed to send reply", err);
    }
  };

  return (
    <Layout>
      <PageHead title={`Ticket ${id} - Support`} />
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{ticket?.subject}</h1>
        <p className="text-sm text-gray-600 mb-8">Status: <span className="font-semibold text-gray-900">{ticket?.status}</span></p>

        <div className="space-y-6 mb-12">
          {ticket?.messages?.map((msg, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${msg.sender === "user" ? "bg-gray-100" : "bg-gray-200"}`}
            >
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-gray-900">{msg.name}</span>
                <span className="text-gray-600">
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
                </span>
              </div>
              <p className="text-gray-900 whitespace-pre-line">{msg.message}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleReply} className="space-y-4">
          <textarea
            rows={5}
            className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-gray-900"
            placeholder="Type your reply here..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            required
          ></textarea>
          <button
            type="submit"
            className="bg-yellow-500 text-black px-6 py-2 rounded hover:bg-yellow-600 transition"
          >
            Send Reply
          </button>
        </form>
      </div>
    </Layout>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
