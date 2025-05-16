import { useRouter } from "next/router";
import Head from "next/head";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { useState } from "react";

// Mocked ticket and message thread
const mockThread = {
  id: "TCK-1001",
  subject: "Refund not processed",
  status: "Open",
  messages: [
    {
      sender: "user",
      name: "Ayman Osman",
      timestamp: "2025-05-01 10:15",
      content: "I requested a refund 3 days ago but haven't received it yet."
    },
    {
      sender: "support",
      name: "Support Agent",
      timestamp: "2025-05-02 09:00",
      content: "Thank you for your message. We are reviewing your refund request."
    }
  ]
};

export default function TicketDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [reply, setReply] = useState("");

  const handleReply = (e) => {
    e.preventDefault();
    alert("Reply sent: " + reply);
    setReply("");
    // TODO: Integrate reply with backend
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Head>
        <title>Ticket {id} - Support | SkillBridge</title>
      </Head>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-2xl font-bold text-yellow-500 mb-4">{mockThread.subject}</h1>
        <p className="text-sm text-gray-400 mb-8">Status: <span className="font-semibold text-yellow-300">{mockThread.status}</span></p>

        <div className="space-y-6 mb-12">
          {mockThread.messages.map((msg, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${msg.sender === "user" ? "bg-gray-800" : "bg-gray-700"}`}
            >
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-yellow-400">{msg.name}</span>
                <span className="text-gray-400">{msg.timestamp}</span>
              </div>
              <p className="text-gray-200 whitespace-pre-line">{msg.content}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleReply} className="space-y-4">
          <textarea
            rows={5}
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
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
      </main>
      <Footer />
    </div>
  );
}
