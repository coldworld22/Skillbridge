import { useRouter } from "next/router";
import PageHead from "@/components/common/PageHead";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useEffect, useState } from "react";
import { fetchTicketById, addMessage, updateStatus } from "@/services/supportService";


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
      <div className="px-6 py-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{ticket?.subject}</h1>
          {status === "Resolved" ? (
            <button
              onClick={handleReopen}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Reopen Ticket
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
            >
              Close Ticket
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-8">From: <strong>{ticket?.user}</strong> | Status: <span className="font-semibold text-yellow-600">{status}</span></p>

        <div className="space-y-6 mb-12">
          {ticket?.messages?.map((msg, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${msg.sender === "user" ? "bg-white border-gray-200" : "bg-yellow-50 border-yellow-200"}`}
            >
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-gray-800">{msg.name}</span>
                <span className="text-gray-500">{msg.timestamp}</span>
              </div>
              <p className="text-gray-700 whitespace-pre-line">{msg.content}</p>
            </div>
          ))}
        </div>

        {status !== "Resolved" && (
          <form onSubmit={handleReply} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Your Reply</label>
            <textarea
              rows={5}
              className="w-full border border-gray-300 rounded px-4 py-2"
              placeholder="Type your reply..."
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
        )}
      </div>
    </AdminLayout>
  );
}
