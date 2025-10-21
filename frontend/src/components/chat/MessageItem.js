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
      className={`my-2 flex items-start gap-3 ${
        isSender ? "flex-row-reverse justify-start" : "justify-start"
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Avatar */}
      <ChatImage
        src={message.avatar || '/images/default-avatar.png'}
        alt="avatar"
        className="h-8 w-8 rounded-full border border-white shadow"
        width={24}
        height={24}
      />

      {/* Message Bubble */}
      <div
        className={`group relative max-w-xs rounded-lg border px-3 py-2 text-sm shadow ${
          isSender ? "border-yellow-300 bg-yellow-400 text-gray-900" : "border-gray-200 bg-white text-gray-900"
        }`}
      >
        {/* Sender Name */}
        <div
          className={`mb-1 text-xs font-semibold ${
            isSender ? "text-yellow-900" : "text-gray-500"
          }`}
        >
          {isSender ? "You" : message.sender}
        </div>
        {/* 📌 Reply Preview */}
        {message.replyTo && (
          <div className="mb-2 border-l-2 border-yellow-300 pl-2 text-xs italic text-gray-500">
            Replying to: “{message.replyTo}”
          </div>
        )}

        {/* 📝 Message Text */}
        {message.text && <p className="leading-snug">{message.text}</p>}

        {/* 📷 Image */}
        {message.file && isImage(message.file) && (
          <ChatImage
            src={getMediaUrl(message.file)}
            alt="Sent image"
            className="mt-2 max-w-full rounded-md object-cover"
            width={300}
            height={200}
          />
        )}
        {message.file && !isImage(message.file) && (
          <a
            href={getMediaUrl(message.file)}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-xs text-yellow-700 underline"
          >
            {message.file.split('/').pop()}
          </a>
        )}

        {/* 🎤 Audio */}
        {message.audio && (
          <div className="mt-2 flex items-center gap-2 rounded-md border border-gray-200 bg-gray-100 p-2">
            <FaPlay className="text-yellow-500" />
            <audio controls src={message.audio} className="w-40" />
          </div>
        )}

        {/* 🔧 Hover Actions */}
        <div className="absolute top-1 right-1 hidden gap-2 text-xs text-gray-500 group-hover:flex">
          <button onClick={onReply} title="Reply" className="hover:text-yellow-600">
            <FaReply />
          </button>
          <button onClick={onPin} title="Pin" className="hover:text-yellow-600">
            <FaThumbtack />
          </button>
          <button onClick={onDelete} title="Delete" className="hover:text-red-500">
            <FaTrash />
          </button>
        </div>

        {/* ⏰ Timestamp + Seen */}
        <div className="mt-2 flex items-center justify-end gap-1 text-xs text-gray-500">
          <span>{formatRelativeTime(message.timestamp)}</span>
          {isSender && <FaCheckDouble className="text-yellow-600" title="Sent" />}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageItem;
