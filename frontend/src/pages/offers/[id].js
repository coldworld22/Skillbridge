import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import Link from "next/link";
import PageHead from "@/components/common/PageHead";
import Head from "next/head";
import useAuthStore from "@/store/auth/authStore";
import { fetchOfferById } from "@/services/offerService";
import {
  fetchResponses,
  fetchMessages as fetchResponseMessages,
  sendMessage as sendResponseMessage,
  deleteMessage as deleteResponseMessage,
} from "@/services/offerResponseService";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  FaArrowLeft,
  FaTag,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaComment,
  FaPaperPlane,
  FaPlayCircle,
  FaVideo,
} from "react-icons/fa";

dayjs.extend(relativeTime);


const OfferDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuthStore();
  const [offer, setOffer] = useState(null);
  const [response, setResponse] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    fetchOfferById(id)
      .then((o) => setOffer(o || null))
      .catch(() => setOffer(null));
    fetchResponses(id)
      .then((resps) => {
        if (resps.length) {
          const r = resps[0];
          setResponse(r);
          return fetchResponseMessages(id, r.id).then((msgs) =>
            setMessages(
              msgs.map((m) => ({
                id: m.id,
                sender: m.sender_name,
                senderId: m.sender_id,
                text: m.message,
                time: m.sent_at,
              }))
            )
          );
        }
        setMessages([]);
      })
      .catch(() => setMessages([]));
  }, [id]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !response) return;
    try {
      const sent = await sendResponseMessage(id, response.id, newMessage.trim());
      const msg = {
        id: sent.id,
        sender: user?.full_name || "You",
        senderId: user?.id,
        text: sent.message,
        time: sent.sent_at,
      };
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
    } catch (_) {}
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await deleteResponseMessage(id, response.id, msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (_) {}
  };

  const renderDealActions = () => {
    if (offer.type === "student") {
      return (
        <button
          onClick={() => alert("Redirecting to create tutorial form...")}
          className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2"
        >
          <FaPlayCircle /> Create Tutorial for This Student
        </button>
      );
    } else {
      return (
        <button
          onClick={() => alert("Redirecting to enroll/payment process...")}
          className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2"
        >
          <FaVideo /> Join This Live Class / Accept Offer
        </button>
      );
    }
  };

  if (!offer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p className="text-gray-400 text-lg">Loading offer details...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      <PageHead title={`${offer.title} – Offer`} />
      <Head>
        <meta name="description" content={`Offer details: ${offer.description}`} />
      </Head>
      <Navbar />

      <main className="pt-24 pb-16 px-6 max-w-4xl mx-auto space-y-6">
        <Link
          href="/offers"
          className="inline-flex items-center gap-2 text-yellow-400 hover:underline"
        >
          <FaArrowLeft /> Back to Offers
        </Link>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-yellow-400">{offer.title}</h1>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full shadow ${
                offer.type === "student" ? "bg-blue-600" : "bg-green-500"
              }`}
            >
              {offer.type === "student" ? "Student Request" : "Instructor Offer"}
            </span>
          </div>

          <p className="text-gray-300 mb-3">{offer.description}</p>

          <div className="flex items-center gap-3 text-sm text-gray-300 mb-2">
            <span className="flex items-center gap-1">
              {offer.type === "student" ? <FaUserGraduate /> : <FaChalkboardTeacher />}
              {offer.type === "student" ? " Student" : " Instructor"}
            </span>
            <span>• Duration: {offer.duration}</span>
            <span>• Price: {offer.price}</span>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {offer.tags.map((tag, i) => (
              <span
                key={i}
                className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs flex items-center gap-1"
              >
                <FaTag className="text-sm" /> {tag}
              </span>
            ))}
          </div>

          <p className="mt-6 text-xs text-gray-500">
            📅 Posted: {dayjs(offer.date).fromNow()}
          </p>

          {/* Negotiation Chat */}
          <div className="bg-gray-900 p-4 rounded-lg mt-10 shadow-md">
            <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
              <FaComment /> Negotiation / Discussion
            </h3>

            <div
              ref={chatRef}
              className="space-y-3 max-h-60 overflow-y-auto mb-4 pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-gray-700 p-3 rounded-md text-sm text-white flex flex-col"
                >
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span className="font-bold">{msg.sender}</span>
                    <span>{dayjs(msg.time).fromNow()}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span>{msg.text}</span>
                    {msg.senderId === user?.id && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="text-red-400 text-xs hover:text-red-500"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message or offer..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1 px-4 py-2 rounded bg-gray-700 text-white border border-gray-600"
              />
              <button
                onClick={handleSend}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded flex items-center gap-2"
              >
                <FaPaperPlane /> Send
              </button>
            </div>
          </div>

          {/* CTA Button based on Role */}
          {renderDealActions()}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OfferDetailsPage;