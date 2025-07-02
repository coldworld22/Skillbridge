import { motion } from "framer-motion";
import ChatImage from "../shared/ChatImage";
import formatRelativeTime from "@/utils/relativeTime";
import { API_BASE_URL } from "@/config/config";
import useAuthStore from "@/store/auth/authStore";
import {
  FaPlay,
  FaCheckDouble,
  FaTrash,
  FaThumbtack,
  FaReply,
} from "react-icons/fa";

const MessageItem = ({ message, onReply, onDelete, onPin }) => {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isSender = message.senderId === currentUserId || message.sender === "You";

  const getMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) return url;
    return `${API_BASE_URL}${url}`;
  };

  const isImage = (path) => {
    if (!path) return false;
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(path) || path.startsWith("data:image/");
  };

  return (
    <motion.div
      className={`flex items-start gap-3 my-2 ${isSender ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Avatar */}
      <ChatImage
        src={message.avatar || '/images/default-avatar.png'}
        alt="avatar"
        className="w-6 h-6 rounded-full border border-gray-500"
        width={24}
        height={24}
      />

      {/* Message Bubble */}
      <div
        className={`relative group p-3 rounded-lg max-w-xs shadow-md ${
          isSender ? "bg-yellow-500 text-gray-900 ml-auto" : "bg-gray-700 text-white"
        }`}
      >
        {/* 📌 Reply Preview */}
        {message.replyTo && (
          <div className="text-sm italic text-yellow-300 mb-2 border-l-4 border-yellow-400 pl-2">
            Replying to: “{message.replyTo}”
          </div>
        )}

        {/* 📝 Message Text */}
        {message.text && <p>{message.text}</p>}

        {/* 📷 Image */}
        {message.file && isImage(message.file) && (
          <ChatImage
            src={getMediaUrl(message.file)}
            alt="Sent image"
            className="rounded-md mt-2 max-w-full object-cover"
            width={300}
            height={200}
          />
        )}
        {message.file && !isImage(message.file) && (
          <a
            href={getMediaUrl(message.file)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-200 text-xs break-all"
          >
            {message.file.split('/').pop()}
          </a>
        )}

        {/* 🎤 Audio */}
        {message.audio && (
          <div className="mt-2 flex items-center gap-2 bg-gray-800 p-2 rounded-md">
            <FaPlay className="text-yellow-300" />
            <audio controls src={message.audio} className="w-40" />
          </div>
        )}

        {/* 🔧 Hover Actions */}
        <div className="absolute top-1 right-1 hidden group-hover:flex gap-2 text-xs text-white">
          <button onClick={onReply} title="Reply">
            <FaReply />
          </button>
          <button onClick={onPin} title="Pin">
            <FaThumbtack />
          </button>
          <button onClick={onDelete} title="Delete">
            <FaTrash />
          </button>
        </div>

        {/* ⏰ Timestamp + Seen */}
        <div className="flex items-center justify-end mt-1 text-xs text-gray-300 gap-1">
          <span>{formatRelativeTime(message.timestamp)}</span>
          {isSender && <FaCheckDouble className="text-blue-300" title="Sent" />}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageItem;
