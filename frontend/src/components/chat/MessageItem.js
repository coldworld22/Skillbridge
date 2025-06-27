import { motion } from "framer-motion";
import ChatImage from "../shared/ChatImage";
import {
  FaPlay,
  FaUserCircle,
  FaCheckDouble,
  FaTrash,
  FaThumbtack,
  FaReply,
} from "react-icons/fa";

const MessageItem = ({ message, onReply, onDelete, onPin }) => {
  const isSender = message.sender === "You";

  return (
    <motion.div
      className={`flex items-start gap-3 my-2 ${isSender ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Avatar */}
      {!isSender && <FaUserCircle className="text-gray-400 text-2xl" />}

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
        {message.image && (
          <ChatImage
            src={message.image}
            alt="Sent image"
            className="rounded-md mt-2 max-w-full object-cover"
            width={300}
            height={200}
          />
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
          <span>{message.timestamp || "..."}</span>
          {isSender && message.status === "seen" && (
            <FaCheckDouble className="text-blue-300" title="Seen" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageItem;
