import { useRouter } from "next/router";
import PageHead from "@/components/common/PageHead";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useEffect, useState } from "react";
import {
  fetchTicketById,
  addMessage,
  updateStatus,
  updatePriority,
  uploadAttachment,
} from "@/services/supportService";
import TicketDetailPanel from "@/components/support/TicketDetailPanel";
import TicketReplyBox from "@/components/support/TicketReplyBox";
import TicketMetaSidebar from "@/components/support/TicketMetaSidebar";
import { toast } from "react-toastify";
import useSupportTranslation from "@/hooks/useSupportTranslation";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import {
  FiArrowLeft,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
  FiMessageSquare,
  FiUser,
  FiCalendar,
  FiTag,
} from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import styles from "@/components/support/SupportDashboard.module.scss";

export default function AdminTicketDetail() {
  const { t } = useSupportTranslation();
  const router = useRouter();
  const { id } = router.query;

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("medium");

  useEffect(() => {
    if (id) load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchTicketById(id);
      const normalizedStatus = data.status?.toLowerCase() || "open";
      const normalizedPriority = data.priority?.toLowerCase() || "medium";
      setTicket({ ...data, status: normalizedStatus, priority: normalizedPriority });
      setStatus(normalizedStatus);
      setPriority(normalizedPriority);
    } catch (err) {
      console.error("Failed to fetch ticket", err);
      toast.error(t("load_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (msg, file) => {
    if (!msg.trim()) return toast.warn(t("reply_required"));
    setReplying(true);
    try {
      const message = await addMessage(id, msg);
      if (file) await uploadAttachment(message.id, file);
      await load();
      toast.success(t("reply_sent"));
    } catch (err) {
      console.error("Failed to send reply", err);
      toast.error(t("reply_failed"));
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    const normalized = newStatus.toLowerCase();
    const confirmMsg =
      normalized === "resolved"
        ? t("confirm_close_ticket")
        : t("confirm_reopen_ticket");
    if (!confirm(confirmMsg)) return;

    try {
      await updateStatus(id, normalized);
      setStatus(normalized);
      setTicket((prev) => ({ ...prev, status: normalized }));
      toast.success(
        normalized === "resolved" ? t("ticket_closed") : t("ticket_reopened")
      );
    } catch (err) {
      console.error("Failed to update status", err);
      toast.error(t("update_failed"));
    }
  };

  const handlePriorityChange = async (newPriority) => {
    const normalizedPriority = newPriority.toLowerCase();
    try {
      await updatePriority(id, normalizedPriority);
      setPriority(normalizedPriority);
      setTicket((prev) => ({ ...prev, priority: normalizedPriority }));
      toast.success(t("priority_updated"));
    } catch (err) {
      console.error("Failed to update priority", err);
      toast.error(t("update_failed"));
    }
  };

  const statusClasses = {
    open: styles.statusOpen,
    pending: styles.statusPending,
    resolved: styles.statusResolved,
    closed: styles.statusClosed,
  };

  const priorityClasses = {
    low: styles.priorityLow,
    medium: styles.priorityMedium,
    high: styles.priorityHigh,
    urgent: styles.priorityUrgent,
  };

  return (
    <AdminLayout>
      <PageHead title={`${t("ticket")} #${id} - ${t("admin_support")}`} />
      
      <div className={styles.page}>
        <div className={styles.detailLayout}>
          <div className={styles.detailMain}>
            <div className={styles.detailTopBar}>
              <button
                onClick={() => router.push("/dashboard/admin/support/tickets")}
                className={styles.linkButton}
              >
                <FiArrowLeft />
                {t("back_to_tickets")}
              </button>
              
              <div className={styles.toolbar}>
                <button
                  onClick={load}
                  disabled={loading}
                  className={styles.textButton}
                >
                  <FiRefreshCw className={loading ? styles.iconSpin : ""} />
                  {t("refresh")}
                </button>
                
                {ticket && (
                  <span className={`${styles.statusPill} ${statusClasses[status] || styles.statusOpen}`}>
                    {t(status)}
                  </span>
                )}
              </div>
            </div>

            {loading ? (
              <div className={styles.stateBox}>
                <FaSpinner className={styles.largeSpinner} />
              </div>
            ) : ticket ? (
              <div className={styles.detailBody}>
                <div>
                  <h1 className={styles.detailTitle}>
                    {ticket.subject}
                  </h1>
                  <div className={styles.metaRow}>
                    <span className={styles.metaItem}>
                      <FiUser /> {ticket.customerName}
                    </span>
                    <span className={styles.metaItem}>
                      <FiCalendar /> {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : ""}
                    </span>
                    <span className={styles.metaItem}>
                      <FiTag />
                      <span className={`${styles.priorityTag} ${priorityClasses[ticket.priority] || styles.priorityMedium}`}>
                        {t(ticket.priority)}
                      </span>
                    </span>
                  </div>
                </div>

                <TicketDetailPanel ticket={ticket} />

                <div className={styles.detailSection}>
                  <h2 className={styles.sectionHeader}>
                    <FiMessageSquare /> {t("add_reply")}
                  </h2>
                  <TicketReplyBox 
                    onSend={handleReply} 
                    disabled={!ticket || replying || status === "resolved"}
                    isSubmitting={replying}
                  />
                  {status === "resolved" && (
                    <div className={styles.warningStrip}>
                      <FiAlertTriangle />
                      {t("ticket_resolved_warning")}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.stateBox}>
                <div className={styles.emptyIcon}>!</div>
                <h3 className={styles.emptyTitle}>{t("ticket_not_found")}</h3>
                <p className={styles.emptyText}>
                  {t("ticket_not_found_description")}
                </p>
                <button
                  onClick={() => router.push("/dashboard/admin/support/tickets")}
                  className={styles.primaryButton}
                >
                  <FiArrowLeft />
                  {t("back_to_tickets")}
                </button>
              </div>
            )}
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sidebarInner}>
              {ticket && (
                <>
                  <TicketMetaSidebar
                    ticket={{ ...ticket, status, priority }}
                    onStatusChange={handleStatusChange}
                    onPriorityChange={handlePriorityChange}
                  />
                  
                  <div className={styles.quickCard}>
                    <h3 className={styles.quickTitle}>
                      {t("quick_actions")}
                    </h3>
                    <div className={styles.stack}>
                      <button
                        onClick={() => {
                          const emailSubject = `Re: Ticket #${ticket.id} - ${ticket.subject}`;
                          window.location.href = `mailto:${ticket.customerEmail}?subject=${encodeURIComponent(emailSubject)}`;
                        }}
                        className={styles.neutralButton}
                      >
                        <FiMessageSquare />
                        {t("email_customer")}
                      </button>
                      {status !== "resolved" ? (
                        <button
                          onClick={() => handleStatusChange("resolved")}
                          className={styles.successButton}
                        >
                          <FiCheckCircle />
                          {t("mark_resolved")}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange("open")}
                          className={`${styles.primaryButton} ${styles.fullWidth}`}
                        >
                          <FiCheckCircle />
                          {t("reopen_ticket")}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
