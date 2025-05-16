import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  FaClock,
  FaDollarSign,
  FaTag,
  FaEnvelope,
  FaWhatsapp,
  FaComments,
  FaEdit,
  FaTrashAlt,
  FaLink,
} from "react-icons/fa";
import Link from "next/link";
import StudentLayout from "@/components/layouts/StudentLayout";

const OfferDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const currentUserId = "student1";

  const [offer, setOffer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    const allOffers = Array.from({ length: 12 }, (_, i) => ({
      id: `${i + 1}`,
      userId: i % 2 === 0 ? "student1" : "instructor1",
      type: i % 2 === 0 ? "student" : "instructor",
      title: i % 2 === 0 ? `Need Help with Subject ${i + 1}` : `Offering Course ${i + 1}`,
      price: `$${100 + i * 10}`,
      duration: `${1 + i % 6} months`,
      tags: ["Flexible", "LiveClass"].slice(0, (i % 2) + 1),
      date: `${i + 1} days ago`,
      description: i % 2 === 0
        ? `I am looking for help with physics and would prefer weekly sessions.`
        : `I am offering structured math classes online every weekend.`,
      status: "Active",
      email: `user${i}@example.com`,
      phone: `+96650000000${i}`,
    }));

    const found = allOffers.find((o) => o.id === id);
    setOffer(found);

    setMessages([
      {
        sender: "student1",
        name: "Ahmed",
        avatar: "/avatars/ahmed.jpg",
        text: "Can you extend the course to 2 months?",
        timeAgo: "2 days ago",
      },
      {
        sender: "instructor1",
        name: "Ms. Aisha",
        avatar: "/avatars/aisha.jpg",
        text: "Yes, I can adjust the schedule accordingly.",
        timeAgo: "1 day ago",
      },
    ]);
  }, [id]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages((prev) => [
        ...prev,
        {
          sender: currentUserId,
          name: "You",
          avatar: "/avatars/ahmed.jpg",
          text: newMessage.trim(),
          timeAgo: "just now",
        },
      ]);
      setNewMessage("");
    }
  };

  if (!offer) return <div className="p-6 text-gray-600">Loading offer details...</div>;

  const isMyRequest = offer.userId === currentUserId && offer.type === "student";

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-lg mt-10 mb-10">
      <Link href="/dashboard/student/offers">
        <button className="text-gray-600 hover:text-gray-800 underline text-sm mb-4">
          ← Back to My Offers
        </button>
      </Link>

      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-gray-800">{offer.title}</h1>
        <span
          className={`text-xs px-2 py-1 rounded-full font-semibold shadow ${
            isMyRequest ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
          }`}
        >
          {isMyRequest ? "Student Request" : "Instructor Offer"}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <p>Posted: {offer.date}</p>
        <span className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">
          Status: {offer.status}
        </span>
      </div>

      <div className="flex items-center gap-3 text-gray-700 mb-2">
        <FaClock className="text-yellow-500" /> <span>{offer.duration}</span>
      </div>

      <div className="flex items-center gap-3 text-gray-700 mb-4">
        <FaDollarSign className="text-yellow-500" /> <span>{offer.price}</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {offer.tags.map((tag, i) => (
          <span key={i} className="bg-yellow-100 text-yellow-800 px-3 py-1 text-xs rounded-full flex items-center gap-1">
            <FaTag className="text-xs" /> {tag}
          </span>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="text-md font-semibold text-gray-700 mb-2">Description</h3>
        <p className="text-gray-700 leading-relaxed">
          {offer.description || "No description provided."}
        </p>
      </div>

      {/* Offer Discussion */}
      <div className="border-t pt-6 mb-10">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">💬 Offer Discussion</h3>
        <div className="space-y-4 max-h-64 overflow-y-auto pr-2 mb-4">
          {messages.map((msg, index) => {
            const isCurrentUser = msg.sender === currentUserId;
            return (
              <div key={index} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                {!isCurrentUser && (
                  <img src={msg.avatar} alt={msg.name} className="w-8 h-8 rounded-full mr-2 mt-1" />
                )}
                <div className="flex flex-col max-w-[75%]">
                  <div className={`p-3 rounded-lg text-sm ${isCurrentUser ? "bg-blue-100 text-blue-800 self-end" : "bg-gray-100 text-gray-700 self-start"}`}>
                    <p className="font-medium">{isCurrentUser ? "You" : msg.name}</p>
                    <p>{msg.text}</p>
                  </div>
                  <span className={`text-xs text-gray-400 mt-1 ${isCurrentUser ? "text-right" : "text-left"}`}>
                    {msg.timeAgo || "just now"}
                  </span>
                </div>
                {isCurrentUser && (
                  <img src="/avatars/ahmed.jpg" alt="You" className="w-8 h-8 rounded-full ml-2 mt-1" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write your message..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm"
          >
            Send
          </button>
        </div>
      </div>

      {/* Contact / Copy Link */}
      <div className="border-t pt-6">
        <h4 className="text-sm font-semibold text-gray-600 mb-3">Contact Instructor</h4>
        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={() => router.push(`/website/pages/messages?to=${offer.userId}`)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition"
          >
            <FaComments /> Message
          </button>
          {offer.phone && (
            <a
              href={`https://wa.me/${offer.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg font-semibold transition"
            >
              <FaWhatsapp /> WhatsApp
            </a>
          )}
          {offer.email && (
            <a
              href={`mailto:${offer.email}`}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded-lg font-semibold transition"
            >
              <FaEnvelope /> Email
            </a>
          )}
        </div>
        <div className="mt-4">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Link copied to clipboard!");
            }}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 gap-2"
          >
            <FaLink /> Copy Offer Link
          </button>
        </div>
      </div>
    </div>
  );
};

OfferDetailsPage.getLayout = (page) => <StudentLayout>{page}</StudentLayout>;

export default OfferDetailsPage;
