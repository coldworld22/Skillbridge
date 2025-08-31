import { useRouter } from "next/router";
import { FaVideo, FaWhatsapp, FaEnvelope } from "react-icons/fa";
import { API_BASE_URL } from "@/config/config";
import formatRelativeTime from "@/utils/relativeTime";
import dayjs from "dayjs";
import ChatImage from "../shared/ChatImage";

const ChatHeader = ({ selectedChat, onStartVideoCall }) => {
  const router = useRouter();

  const getAvatarUrl = (url, fallback = "/images/default-avatar.png") => {
    if (!url) return fallback;
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    return `${API_BASE_URL}${url}`;
  };

  if (!selectedChat) {
    return <div className="text-gray-400 text-center p-4">No chat selected</div>;
  }

  const avatar = selectedChat.isGroup
    ? selectedChat.cover_image || selectedChat.image
    :
        selectedChat.profileImage ||
        selectedChat.profile_image ||
        selectedChat.avatar_url;

  const isOnline =
    selectedChat.isOnline ?? selectedChat.is_online ?? selectedChat.status === "online";
  const lastActiveRaw = selectedChat.lastActive || selectedChat.last_active;
  const hasPhone = !!selectedChat.phone;
  const email = selectedChat.email;

  const formatLastActive = () => {
    if (!lastActiveRaw) return "";
    const date = dayjs(lastActiveRaw);
    if (!date.isValid()) return "";
    const absolute = date.format("YYYY-MM-DD HH:mm");
    const relative = formatRelativeTime(lastActiveRaw);
    return relative ? `${absolute} (${relative})` : absolute;
  };

  const handleVideoCall = async () => {
    if (onStartVideoCall) {
      const res = await onStartVideoCall(selectedChat.id);
      if (res?.roomId) {
        router.push(`/video-call?roomId=${res.roomId}`);
      }
    }
  };

  const handleWhatsAppChat = () => {

    if (!selectedChat.phone) {

      alert("Phone number is missing!");
      return;
    }

    const phoneNumber = selectedChat.phone.replace(/\D/g, ""); // Remove non-numeric characters

    // Direct the user to WhatsApp with the selected phone number
    window.open(`https://wa.me/${phoneNumber}`, "_blank");
  };

  const handleSendEmail = () => {
    if (email) {
      window.location.href = `mailto:${email}?subject=Let's Chat&body=Hello!`;
    } else {
      alert("Email is missing!");
    }
  };

  return (
    <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-700">
      {/* Chat Name */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <ChatImage
            src={getAvatarUrl(
              avatar,
              selectedChat.isGroup ? "/images/group-placeholder.jpg" : undefined
            )}
            alt="avatar"
            className="w-8 h-8 rounded-full border border-gray-500"
            width={32}
            height={32}
          />
          {!selectedChat.isGroup && (
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border border-gray-700 ${
                isOnline ? "bg-green-500" : "bg-gray-500"
              }`}
            />
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold text-yellow-500">
            {selectedChat.groupName || selectedChat.name || "Unknown Chat"}
          </h3>
          {!selectedChat.isGroup && (
            <div className="text-sm text-gray-400">
              {isOnline ? "Online" : `Last active ${formatLastActive()}`}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {/* ✅ Video Call Button */}
        <button
          className="px-3 py-2 bg-yellow-500 text-white rounded flex items-center gap-2 hover:bg-yellow-600 transition"
          onClick={handleVideoCall}
        >
          <FaVideo /> Video Call
        </button>

        {/* ✅ WhatsApp Button */}
        <button
          className={`px-3 py-2 text-white rounded flex items-center gap-2 transition ${
            hasPhone ? "bg-green-500 hover:bg-green-600" : "bg-gray-600 cursor-not-allowed opacity-50"
          }`}
          onClick={hasPhone ? handleWhatsAppChat : undefined}
          disabled={!hasPhone}
        >
          <FaWhatsapp /> WhatsApp
        </button>

        {/* ✅ Email Button */}
        {email && (
          <button
            className="px-3 py-2 bg-gray-600 text-white rounded flex items-center gap-2 hover:bg-gray-700 transition"
            onClick={handleSendEmail}
          >
            <FaEnvelope /> Email
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
