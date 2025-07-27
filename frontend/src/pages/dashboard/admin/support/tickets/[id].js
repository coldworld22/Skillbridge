import { useRouter } from "next/router";
import PageHead from "@/components/common/PageHead";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useEffect, useState } from "react";
import {
  fetchTicketById,
  addMessage,
  updateStatus
} from "@/services/supportService";
import TicketDetailPanel from "@/components/support/TicketDetailPanel";
import TicketReplyBox from "@/components/support/TicketReplyBox";
import TicketMetaSidebar from "@/components/support/TicketMetaSidebar";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

export default function AdminTicketDetail() {
  const { t } = useTranslation("dashboard");
  const router = useRouter();
  const { id } = router.query;

  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("open");

  useEffect(() => {
    if (id) load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchTicketById(id);
      setTicket(data);
      setStatus(data.status);
    } catch (err) {
      console.error("Failed to fetch ticket", err);
      toast.error(t("load_failed"));
    }
    setLoading(false);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return toast.warn(t("reply_required"));
    try {
      await addMessage(id, reply);
      setReply("");
      load();
      toast.success(t("reply_sent"));
    } catch (err) {
      console.error("Failed to send reply", err);
      toast.error(t("update_failed"));
    }
  };

  const handleStatusChange = async (newStatus) => {
    const confirmMsg =
      newStatus === "resolved"
        ? t("confirm_close_ticket")
        : t("confirm_reopen_ticket");
    if (!confirm(confirmMsg)) return;

    try {
      await updateStatus(id, newStatus);
      setStatus(newStatus);
      setTicket((prev) => ({ ...prev, status: newStatus }));
      toast.success(
        newStatus === "resolved" ? t("ticket_closed") : t("ticket_reopened")
      );
    } catch (err) {
      console.error("Failed to update status", err);
      toast.error(t("update_failed"));
    }
  };

  return (
    <AdminLayout>
      <PageHead title={`Ticket #${id} - Admin Support`} />
      <div className="flex flex-col lg:flex-row">
        {/* Ticket Panel */}
        <div className="flex-1 px-6 py-8">
          {loading ? (
            <div className="text-gray-400">{t("loading")}...</div>
          ) : (
            <>
              <TicketDetailPanel ticket={ticket} />
              <div className="mt-6">
                <TicketReplyBox
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onSend={handleReply}
                  disabled={!ticket}
                />
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[320px] border-t lg:border-t-0 lg:border-l px-6 py-8 bg-gray-50">
          <TicketMetaSidebar
            ticket={{ ...ticket, status }}
            onStatusChange={handleStatusChange}
            onPriorityChange={() => {}}
          />
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
