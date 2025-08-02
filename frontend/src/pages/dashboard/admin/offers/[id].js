import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  FaClock,
  FaDollarSign,
  FaTag,
  FaEnvelope,
  FaWhatsapp,
  FaLink,
  FaUserShield,
  FaBan,
} from "react-icons/fa";
import Link from "next/link";
import AdminLayout from "@/components/layouts/AdminLayout";
import { fetchOfferById, updateOffer } from "@/services/admin/offerService";
import { updateUserStatus } from "@/services/admin/userService";
import {
  fetchResponses,
  fetchMessages as fetchResponseMessages,
} from "@/services/offerResponseService";
import { API_BASE_URL } from "@/config/config";
import formatRelativeTime from "@/utils/relativeTime";

const getAvatarUrl = (url) => {
  if (!url) return "/images/default-avatar.png";
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  return `${API_BASE_URL}${url}`;
};

const AdminOfferDetails = () => {
  const router = useRouter();
  const { id } = router.query;

  const [offer, setOffer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [offerUrl, setOfferUrl] = useState("");

  const handleCloseOffer = async () => {
    if (!offer || offer.status === "closed") return;
    if (!confirm("Close this offer?")) return;
    try {
      await updateOffer(offer.id, { status: "closed" });
      setOffer((prev) => ({ ...prev, status: "closed" }));
      alert("Offer closed.");
    } catch (_) {
      alert("Failed to close offer.");
    }
  };

  const handleFlagUser = async () => {
    if (!offer?.userId) return;
    if (!confirm("Flag this user for review?")) return;
    try {
      await updateUserStatus(offer.userId, "suspended");
      alert("User flagged for review.");
    } catch (_) {
      alert("Failed to flag user.");
    }
  };

  useEffect(() => {
    setOfferUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!id) return;

    fetchOfferById(id)
      .then((o) => {
        if (!o) return setOffer(null);
        setOffer({
          id: o.id,
          userId: o.student_id,
          type:
            o.student_role?.toLowerCase() === "instructor"
              ? "instructor"
              : "student",
          title: o.title,
          price: o.budget || "",
          duration: o.timeframe || "",
          tags: [],
          date: o.created_at
            ? new Date(o.created_at).toLocaleDateString()
            : "",
          expiresAt: o.expires_at
            ? new Date(o.expires_at).toLocaleDateString()
            : null,
          description: o.description || "",
          status: o.status,
          email: o.student_email || "",
          phone: o.student_phone || "",
        });

        return fetchResponses(o.id);
      })
      .then(async (resps) => {
        if (!resps) return setMessages([]);
        const allMsgs = await Promise.all(
          resps.map((r) => fetchResponseMessages(id, r.id))
        );
        const merged = allMsgs
          .flat()
          .sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at))
          .map((m) => ({
            id: m.id,
            name: m.sender_name,
            avatar: getAvatarUrl(m.sender_avatar),
            text: m.message,
            timeAgo: formatRelativeTime(m.sent_at),
          }));
        setMessages(merged);
      })
      .catch(() => {
        setOffer(null);
        setMessages([]);
      });
  }, [id]);

  if (!offer) return <div className="p-6 text-gray-600">Loading offer...</div>;

  const isStudentOffer = offer.type === "student";

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-lg mt-10 mb-12">
      <Link href="/dashboard/admin/offers">
        <button className="text-gray-600 hover:text-gray-800 underline text-sm mb-6 block">
          ← Back to Offer List
        </button>
      </Link>

      <div className="flex justify-between items-center mb-3">
        <h1 className="text-2xl font-bold text-gray-800">{offer.title}</h1>
        <span className={`text-xs px-3 py-1 rounded-full font-semibold shadow ${isStudentOffer ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
          {isStudentOffer ? "Student Request" : "Instructor Offer"}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-2 text-sm text-gray-500 mb-6">
        <p>Posted: {offer.date}</p>
        {offer.expiresAt && <p>Available until: {offer.expiresAt}</p>}
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
          {offer.description}
        </p>
        {offer.expiresAt && (
          <p className="text-sm text-gray-500 mt-4">
            This offer is available until {offer.expiresAt}.
          </p>
        )}
      </div>

      <div className="border-t pt-6 mb-10">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">💬 Discussion Thread</h3>
        <div className="space-y-4 max-h-64 overflow-y-auto pr-2 mb-4">
          {messages.map((msg, index) => (
            <div key={index} className="flex items-start gap-2">
              <img src={msg.avatar} alt={msg.name} className="w-8 h-8 rounded-full mt-1" />
              <div className="bg-gray-100 rounded-lg p-3 text-sm max-w-[75%]">
                <div className="font-semibold text-gray-800">{msg.name}</div>
                <div className="text-gray-700">{msg.text}</div>
                <div className="text-xs text-gray-400 mt-1">{msg.timeAgo}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-semibold text-gray-600 mb-3">Contact Info</h4>
        <div className="flex flex-wrap gap-4 items-center">
          {offer.phone && (
            <a
              href={`https://wa.me/${offer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                `Check out this offer: ${offerUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg font-semibold transition"
            >
              <FaWhatsapp /> WhatsApp
            </a>
          )}
          {offer.email && (
            <a
              href={`mailto:${offer.email}?subject=${encodeURIComponent(
                `Offer: ${offer.title}`
              )}&body=${encodeURIComponent(`Check out this offer: ${offerUrl}`)}`}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded-lg font-semibold transition"
            >
              <FaEnvelope /> Email
            </a>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleFlagUser}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold text-sm"
          >
            <FaUserShield /> Flag User
          </button>
          {offer.status !== "closed" && (
            <button
              onClick={handleCloseOffer}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm"
            >
              <FaBan /> Close Offer
            </button>
          )}
        </div>

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

AdminOfferDetails.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default AdminOfferDetails;
