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
import useSupportTranslation from "@/hooks/useSupportTranslation";
import styles from "../support.module.scss";

const isImage = (url) =>
  url ? /\.(png|jpe?g|gif|webp|svg)$/i.test(url) : false;

export default function TicketDetailPage() {
  const { t } = useSupportTranslation();
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
    <div className={styles.shell}>
      <Navbar />
      <main className={styles.main}>{children}</main>
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
      <div className={styles.content}>
        <div className={styles.ticketHeader}>
          <h1 className={styles.ticketTitle}>{ticket?.subject}</h1>
          <p className={styles.meta}>
            Status: <span>{ticket?.status}</span>
          </p>
        </div>

        <div className={styles.messageList}>
          {ticket?.messages?.map((msg, index) => (
            <div
              key={index}
              className={`${styles.message} ${msg.sender === "user" ? styles.message : styles.messageAlt}`}
            >
              <div className={styles.messageMeta}>
                <span>{msg.name || msg.sender_name}</span>
                <span>{msg.timestamp || msg.createdAt}</span>
              </div>
              <p className={styles.messageText}>{msg.message}</p>
              {msg.attachments?.length > 0 && (
                <div className={styles.attachmentList}>
                  {msg.attachments.map((a) =>
                    isImage(a.file_url) ? (
                      <img
                        key={a.id}
                        src={a.file_url}
                        alt={a.file_name || 'attachment'}
                        className={styles.attachmentImage}
                      />
                    ) : (
                      <a
                        key={a.id}
                        href={a.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.attachmentLink}
                      >
                        {a.file_name || a.file_url.split('/').pop()}
                      </a>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleReply} className={styles.replyForm}>
          <textarea
            rows={5}
            className={styles.textarea}
            placeholder="Type your reply here..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            required
          ></textarea>
          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.primaryButton}
            >
              Send Reply
            </button>
          </div>
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
      ...(await serverSideTranslations(locale, ['common', 'dashboard'], nextI18NextConfig)),
    },
  };
}
