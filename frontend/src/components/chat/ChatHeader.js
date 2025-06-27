import { useRouter } from "next/router";
import { FaVideo, FaWhatsapp, FaEnvelope } from "react-icons/fa";
import { API_BASE_URL } from "@/config/config";
import ChatImage from "../shared/ChatImage";

const ChatHeader = ({ selectedChat }) => {
  const router = useRouter();

  const getAvatarUrl = (url) => {
    if (!url) return "/images/default-avatar.png";
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    return `${API_BASE_URL}${url}`;
  };

  if (!selectedChat) {
    return <div className="text-gray-400 text-center p-4">No chat selected</div>;
  }

 
  const handleVideoCall = () => {
    router.push(`/video-call?chatId=${selectedChat.id}`);
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
    if (selectedChat.email) {
      window.location.href = `mailto:${selectedChat.email}?subject=Let's Chat&body=Hello!`;
    } else {
      alert("Email is missing!");
    }
  };

  return (
    <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-700">
      {/* Chat Name */}
      <h3 className="text-lg font-bold text-yellow-500 flex items-center gap-2">
        <ChatImage
          src={getAvatarUrl(selectedChat.profileImage)}
          alt="avatar"
          className="w-8 h-8 rounded-full border border-gray-500"
          width={32}
          height={32}
        />
        {selectedChat.groupName || selectedChat.name || "Unknown Chat"}
      </h3>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {/* ✅ Video Call Button */}
        <button
          className="px-3 py-2 bg-yellow-500 text-white rounded flex items-center gap-2 hover:bg-yellow-600 transition"
          onClick={handleVideoCall}
        >
          <FaVideo /> Video Call
        </button>

        {/* ✅ WhatsApp Button (Only If Phone Exists) */}
        {selectedChat.phone && (
          <button
            className="px-3 py-2 bg-green-500 text-white rounded flex items-center gap-2 hover:bg-green-600 transition"
            onClick={handleWhatsAppChat}
          >
            <FaWhatsapp /> WhatsApp
          </button>
        )}

        {/* ✅ Email Button (Only If Email Exists) */}
        {selectedChat.email && (
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
