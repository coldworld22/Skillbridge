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
import InstructorLayout from "@/components/layouts/InstructorLayout";
import useAuthStore from "@/store/auth/authStore";
import { fetchOfferById } from "@/services/offerService";
import { updateOffer } from "@/services/admin/offerService";
import { toast } from "react-toastify";
import {
  createResponse,
  fetchResponses,
  fetchMessages as fetchResponseMessages,
  sendMessage as sendResponseMessage,
  deleteMessage as deleteResponseMessage,
} from "@/services/offerResponseService";
import MessageInput from "@/components/chat/MessageInput";
import formatRelativeTime from "@/utils/relativeTime";
import { API_BASE_URL } from "@/config/config";
import ChatImage from "@/components/shared/ChatImage";

const getAvatarUrl = (url) => {
  if (!url) return "/images/default-avatar.png";
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  return `${API_BASE_URL}${url}`;
};

const getMediaUrl = (url) => {
  if (!url) return null;
  if (
    url.startsWith("http") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  )
    return url;
  return `${API_BASE_URL}${url}`;
};

const isImage = (path) => {
  if (!path) return false;
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(path) || path.startsWith("data:image/");
};
const OfferDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  const [offer, setOffer] = useState(null);
  const [response, setResponse] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);

  const toggleStatus = async () => {
    if (!offer) return;
    const newStatus = offer.status === "open" ? "closed" : "open";
    setOffer((prev) => ({ ...prev, status: newStatus }));
    try {
      await updateOffer(offer.id, { status: newStatus });
      toast.success(
        `Offer ${newStatus === "open" ? "opened" : "closed"} successfully`,
        { theme: "dark" }
      );
    } catch (_) {
      toast.error("Failed to update offer", { theme: "dark" });
    }
  };

  useEffect(() => {
    if (!id) return;

    fetchOfferById(id)
      .then((o) => {
        if (!o) return setOffer(null);
        setOffer({
          id: o.id,
          userId: o.student_id,
          name: o.student_name,
          avatar: o.student_avatar,
          type:
            o.student_role?.toLowerCase() === "instructor"
              ? "instructor"
              : "student",
          offerType: o.offer_type,
          title: o.title,
          price: o.budget || "",
          duration: o.timeframe || "",
          tags: [],
          date: o.created_at ? new Date(o.created_at).toLocaleDateString() : "",
          description: o.description || "",
          status: o.status || "open",
          email: o.email || "",
          phone: o.phone || "",
        });
      })
      .catch(() => setOffer(null));
  }, [id]);

  useEffect(() => {
    if (!offer) return;
    fetchResponses(offer.id)
      .then((resps) => {
        if (!resps.length) {
          setResponse(null);
          setMessages([]);
          return;
        }
        const myResp = resps.find(
          (r) => r.instructor_id === currentUserId
        );

        if (myResp) {
          setResponse(myResp);
          return fetchResponseMessages(offer.id, myResp.id).then(setMessages);
        }

        if (offer.userId === currentUserId) {
          const firstResp = resps[0];
          setResponse(firstResp);
          return fetchResponseMessages(offer.id, firstResp.id).then(setMessages);
        }

        // No response associated with current instructor
        setResponse(null);
        setMessages([]);
      })
      .catch(() => {
        setResponse(null);
        setMessages([]);
      });
  }, [offer]);

  useEffect(() => {
    if (!offer || !response) return;

    const loadMessages = () => {
      fetchResponseMessages(offer.id, response.id)
        .then(setMessages)
        .catch(() => {});
    };

    loadMessages();
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [offer, response]);
  const handleSendMessage = async ({ text, file, audio }) => {
    if (!text?.trim()) return;
    if (file || audio) {
      toast.error("Attachments not supported for offer messages", { theme: "colored" });
    }
    try {
      let resp = response;
      if (
        !resp ||
        (resp.instructor_id !== currentUserId && offer.userId !== currentUserId)
      ) {
        resp = await createResponse(offer.id, {});
        setResponse(resp);
        setMessages([]);
      }
      const sent = await sendResponseMessage(
        offer.id,
        resp.id,
        text.trim(),
        replyTo?.id
      );
      setMessages((prev) => [...prev, sent]);
      setReplyTo(null);
      toast.success("Message sent!", { theme: "colored" });
    } catch (_) {
      toast.error("Failed to send message", { theme: "colored" });
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await deleteResponseMessage(offer.id, response.id, msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      toast.info("Message deleted.");
    } catch (_) {
      toast.error("Failed to delete message", { theme: "colored" });
    }
  };

  if (!offer) return <div className="p-6 text-gray-600">Loading offer details...</div>;

  const isMyOffer = offer.userId === currentUserId;
  const isStudentOffer = offer.type === "student";

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-lg mt-10 mb-12">
      <Link href="/dashboard/instructor/offers">
        <button className="text-gray-600 hover:text-gray-800 underline text-sm mb-6 block">
          ← Back to My Offers
        </button>
      </Link>

      <div className="flex justify-between items-center mb-3">
        <h1 className="text-2xl font-bold text-gray-800">{offer.title}</h1>
        <span className={`text-xs px-3 py-1 rounded-full font-semibold shadow ${isStudentOffer ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
          {isStudentOffer ? "Student Request" : "Instructor Offer"}
        </span>
      </div>

      <div className="flex flex-wrap justify-between text-sm text-gray-500 mb-6 gap-2">
        <p>Posted: {offer.date}</p>
        <span className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">
          Type: {offer.offerType}
        </span>
        <span className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">
          Status: {offer.status}
        </span>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex gap-2 items-center text-gray-700">
          <FaClock className="text-yellow-500" /> {offer.duration}
        </div>
        <div className="flex gap-2 items-center text-gray-700">
          <FaDollarSign className="text-yellow-500" /> {offer.price}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {offer.tags.map((tag, i) => (
            <span key={i} className="bg-yellow-100 text-yellow-800 px-3 py-1 text-xs rounded-full flex items-center gap-1">
              <FaTag className="text-xs" /> {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-10">
        <h3 className="text-md font-semibold text-gray-700 mb-2">Description</h3>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
          {offer.description || "No description provided."}
        </p>
      </div>

      {/* Offer Discussion Section */}
      <div className="border-t pt-6 mb-10">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">💬 Offer Discussion</h3>
        <>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2 mb-4">
            {messages.map((msg) => {
            const isCurrentUser = msg.sender_id === currentUserId;
            return (
                <div key={msg.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                {!isCurrentUser && (
                  <ChatImage
                    src={getAvatarUrl(offer.avatar)}
                    alt={offer.name}
                    className="w-8 h-8 rounded-full mr-2 mt-1"
                    width={32}
                    height={32}
                  />
                )}
                <div className="flex flex-col max-w-[75%]">
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      isCurrentUser
                        ? "bg-blue-100 text-blue-800 self-end"
                        : "bg-gray-100 text-gray-700 self-start"
                    }`}
                  >
                    <p className="font-medium">
                      {isCurrentUser ? "You" : offer.name}
                    </p>
                    {msg.reply_message && (
                      <div className="text-xs italic text-gray-500 border-l-2 border-yellow-400 pl-2 mb-1">
                        {msg.reply_message}
                      </div>
                    )}
                    {msg.reply_file_url && isImage(msg.reply_file_url) && (
                      <ChatImage
                        src={getMediaUrl(msg.reply_file_url)}
                        alt="reply file"
                        className="max-w-xs rounded-md mb-1"
                        width={200}
                        height={200}
                      />
                    )}
                    {msg.reply_file_url && !isImage(msg.reply_file_url) && (
                      <a
                        href={getMediaUrl(msg.reply_file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-xs mb-1"
                      >
                        {msg.reply_file_url.split("/").pop()}
                      </a>
                    )}
                    {msg.reply_audio_url && (
                      <audio
                        controls
                        src={getMediaUrl(msg.reply_audio_url)}
                        className="w-48 mb-1"
                      />
                    )}
                    {msg.message && <p>{msg.message}</p>}
                    {msg.file_url && isImage(msg.file_url) && (
                      <ChatImage
                        src={getMediaUrl(msg.file_url)}
                        alt="attachment"
                        className="max-w-xs rounded-md mt-1"
                        width={200}
                        height={200}
                      />
                    )}
                    {msg.file_url && !isImage(msg.file_url) && (
                      <a
                        href={getMediaUrl(msg.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-600 text-sm mt-1"
                      >
                        {msg.file_url.split("/").pop()}
                      </a>
                    )}
                    {msg.audio_url && (
                      <audio
                        controls
                        src={getMediaUrl(msg.audio_url)}
                        className="mt-1 w-48"
                      />
                    )}
                  </div>
                  <div className={`flex items-center text-xs text-gray-400 mt-1 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                    <span>{formatRelativeTime(msg.sent_at)}</span>
                    <button
                      onClick={() => setReplyTo(msg)}
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      Reply
                    </button>
                    {isCurrentUser && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="ml-2 text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                {isCurrentUser && (
                  <ChatImage
                    src={getAvatarUrl(user?.avatar_url)}
                    alt="You"
                    className="w-8 h-8 rounded-full ml-2 mt-1"
                    width={32}
                    height={32}
                  />
                )}
              </div>
            );
            })}
            {messages.length === 0 && (
              <p className="text-gray-500">No messages yet. Start the discussion below.</p>
            )}
          </div>

          <div className="mt-4">
            <MessageInput
              sendMessage={handleSendMessage}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
            />
          </div>
        </>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 pt-6">
        {isMyOffer ? (
          <div className="flex flex-wrap gap-4 items-center">
            <Link href={`/dashboard/instructor/offers/edit/${offer.id}`}>
              <button className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition">
                <FaEdit /> Edit
              </button>
            </Link>
            <button
              onClick={toggleStatus}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              {offer.status === "open" ? "Close" : "Open"} Offer
            </button>
            <button
              onClick={() => {
                if (confirm("Are you sure you want to delete this offer?")) {
                  alert("Offer deleted!");
                  router.push("/dashboard/instructor/offers");
                }
              }}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              <FaTrashAlt /> Delete
            </button>
          </div>
        ) : (
          <>
            <h4 className="text-sm font-semibold text-gray-600 mb-3">
              Contact {isStudentOffer ? "Student" : "Instructor"}
            </h4>
            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={() => router.push(`/messages?to=${offer.userId}`)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition"
              >
                <FaComments /> Message
              </button>
              <a
                href={`https://wa.me/${offer.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg font-semibold transition"
              >
                <FaWhatsapp /> WhatsApp
              </a>
              <a
                href={`mailto:${offer.email}`}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded-lg font-semibold transition"
              >
                <FaEnvelope /> Email
              </a>
            </div>
          </>
        )}

        {/* Copy Link */}
        <div className="mt-6">
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

OfferDetailsPage.getLayout = (page) => <InstructorLayout>{page}</InstructorLayout>;

export default OfferDetailsPage;
