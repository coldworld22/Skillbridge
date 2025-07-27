import { useRouter } from "next/router";
import PageHead from "@/components/common/PageHead";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useEffect, useState } from "react";
import { fetchTicketById, addMessage, updateStatus } from "@/services/supportService";
import TicketDetailPanel from "@/components/support/TicketDetailPanel";
import TicketReplyBox from "@/components/support/TicketReplyBox";
import TicketMetaSidebar from "@/components/support/TicketMetaSidebar";


export default function AdminTicketDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("open");

  useEffect(() => {
    if (id) load();
  }, [id]);

  const load = async () => {
    try {
      const data = await fetchTicketById(id);
      setTicket(data);
      setStatus(data.status);
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
    } catch (err) {
      console.error("Failed to send reply", err);
    }
  };

  const handleClose = async () => {
    const confirmed = confirm("Are you sure you want to close this ticket?");
    if (confirmed) {
      try {
        await updateStatus(id, "resolved");
        setStatus("resolved");
      } catch (err) {
        console.error("Failed to close ticket", err);
      }
    }
  };

  const handleReopen = async () => {
    const confirmed = confirm("Reopen this ticket?");
    if (confirmed) {
      try {
        await updateStatus(id, "open");
        setStatus("open");
      } catch (err) {
        console.error("Failed to reopen ticket", err);
      }
    }
  };

  return (
    <AdminLayout>
      <PageHead title={`Ticket ${id} - Admin`} />
      <div className="flex">
        <div className="flex-1 px-6 py-10">
          <TicketDetailPanel ticket={ticket} />
          <TicketReplyBox onSend={handleReply} />
        </div>
        <TicketMetaSidebar ticket={ticket} onStatusChange={handleClose} onPriorityChange={() => {}} />
      </div>
    </AdminLayout>
  );
}
