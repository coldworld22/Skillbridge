import { useRouter } from "next/router";
import PageHead from "@/components/common/PageHead";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useEffect, useState } from "react";
import {
  fetchTicketById,
  addMessage,
  updateStatus,
  updatePriority,
  uploadAttachment
} from "@/services/supportService";
import TicketDetailPanel from "@/components/support/TicketDetailPanel";
import TicketReplyBox from "@/components/support/TicketReplyBox";
import TicketMetaSidebar from "@/components/support/TicketMetaSidebar";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import { FiArrowLeft, FiRefreshCw, FiAlertTriangle, FiCheckCircle, FiMessageSquare, FiUser, FiCalendar, FiTag } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";

export default function AdminTicketDetail() {
  const { t } = useTranslation("dashboard");
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

  const getStatusColor = (status) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-blue-100 text-blue-800";
      case "high": return "bg-yellow-100 text-yellow-800";
      case "urgent": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AdminLayout>
      <PageHead title={`${t("ticket")} #${id} - ${t("admin_support")}`} />
      
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Main Content */}
        <div className="flex-1 bg-white">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <button
              onClick={() => router.push("/dashboard/admin/support/tickets")}
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <FiArrowLeft className="mr-2" />
              {t("back_to_tickets")}
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={load}
                disabled={loading}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
              >
                <FiRefreshCw className={`mr-2 ${loading ? "animate-spin" : ""}`} />
                {t("refresh")}
              </button>
              
              {ticket && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                  {t(status)}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
            </div>
          ) : ticket ? (
            <div className="px-6 py-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {ticket.subject}
                </h1>
                <div className="flex flex-wrap items-center text-sm text-gray-500 gap-y-1 gap-x-4">
                  <span className="flex items-center">
                    <FiUser className="mr-1.5" /> {ticket.customerName}
                  </span>
                  <span className="flex items-center">
                    <FiCalendar className="mr-1.5" /> {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : ""}
                  </span>
                  <span className="flex items-center">
                    <FiTag className="mr-1.5" />
                    <span className={`px-2 py-0.5 rounded ${getPriorityColor(ticket.priority)}`}>
                      {t(ticket.priority)}
                    </span>
                  </span>
                </div>
              </div>

              <TicketDetailPanel ticket={ticket} />

              <div className="mt-8 border-t border-gray-200 pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FiMessageSquare className="mr-2" /> {t("add_reply")}
                </h2>
                <TicketReplyBox 
                  onSend={handleReply} 
                  disabled={!ticket || replying || status === "resolved"}
                  isSubmitting={replying}
                />
                {status === "resolved" && (
                  <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded-md text-sm flex items-start">
                    <FiAlertTriangle className="flex-shrink-0 mr-2 mt-0.5" />
                    {t("ticket_resolved_warning")}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <FiAlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                {t("ticket_not_found")}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t("ticket_not_found_description")}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push("/dashboard/admin/support/tickets")}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiArrowLeft className="mr-2" />
                  {t("back_to_tickets")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 bg-gray-50">
          <div className="p-6 sticky top-0">
            {ticket && (
              <TicketMetaSidebar
                ticket={{ ...ticket, status, priority }}
                onStatusChange={handleStatusChange}
                onPriorityChange={handlePriorityChange}
              />
            )}
            
            {ticket && (
              <div className="mt-6 p-4 bg-white rounded-lg shadow-xs border border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  {t("quick_actions")}
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const emailSubject = `Re: Ticket #${ticket.id} - ${ticket.subject}`;
                      window.location.href = `mailto:${ticket.customerEmail}?subject=${encodeURIComponent(emailSubject)}`;
                    }}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FiMessageSquare className="mr-2" />
                    {t("email_customer")}
                  </button>
                  {status !== "resolved" ? (
                    <button
                      onClick={() => handleStatusChange("resolved")}
                      className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                    >
                      <FiCheckCircle className="mr-2" />
                      {t("mark_resolved")}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange("open")}
                      className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <FiCheckCircle className="mr-2" />
                      {t("reopen_ticket")}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
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