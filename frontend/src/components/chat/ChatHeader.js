import { FaEnvelope } from "react-icons/fa";
import { API_BASE_URL } from "@/config/config";
import formatRelativeTime from "@/utils/relativeTime";
import dayjs from "dayjs";
import ChatImage from "../shared/ChatImage";

const ChatHeader = ({ selectedChat }) => {
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
  const email = selectedChat.email;

  const formatLastActive = () => {
    if (!lastActiveRaw) return "";
    const date = dayjs(lastActiveRaw);
    if (!date.isValid()) return "";
    const absolute = date.format("YYYY-MM-DD HH:mm");
    const relative = formatRelativeTime(lastActiveRaw);
    return relative ? `${absolute} (${relative})` : absolute;
  };
  const lastActiveLabel = formatLastActive();

  const handleSendEmail = () => {
    if (email) {
      window.location.href = `mailto:${email}?subject=Let's Chat&body=Hello!`;
    } else {
      alert("Email is missing!");
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <ChatImage
            src={getAvatarUrl(
              avatar,
              selectedChat.isGroup ? "/images/group-placeholder.jpg" : undefined
            )}
            alt="avatar"
            className="h-10 w-10 rounded-full border border-white shadow"
            width={40}
            height={40}
          />
          {!selectedChat.isGroup && (
            <span
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border border-white ${
                isOnline ? "bg-green-500" : "bg-gray-400"
              }`}
            />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedChat.groupName || selectedChat.name || selectedChat.full_name || "Conversation"}
          </h3>
          {!selectedChat.isGroup && (
            <div className="text-sm text-gray-500">
              {isOnline ? "Online" : lastActiveLabel ? `Last active ${lastActiveLabel}` : ""}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        {email && (
          <button
            className="flex items-center gap-2 rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-300"
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
