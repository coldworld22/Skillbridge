import { motion } from "framer-motion";
import { FaPlay, FaUserCircle } from "react-icons/fa";

const MessageItem = ({ message }) => {
  const isSender = message.sender === "You"; // ✅ Check if it's a sent message

  return (
    <motion.div 
      className={`flex items-start gap-3 my-2 ${isSender ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 👤 User Icon (Only for Received Messages) */}
      {!isSender && <FaUserCircle className="text-gray-400 text-2xl" />}

      {/* 🟡 Message Bubble */}
      <div 
        className={`p-3 rounded-lg max-w-xs shadow-md ${
          isSender ? "bg-yellow-500 text-gray-900 ml-auto" : "bg-gray-700 text-white"
        }`}
      >
        {/* 📝 Text Message */}
        {message.text && <p>{message.text}</p>}

        {/* 📂 Image Preview */}
        {message.image && (
          <img 
            src={message.image} 
            alt="Sent image" 
            className="rounded-md mt-2 max-w-full object-cover"
          />
        )}

        {/* 🎙️ Audio Message */}
        {message.audio && (
          <div className="mt-2 flex items-center gap-2 bg-gray-800 p-2 rounded-md">
            <FaPlay className="text-yellow-300" />
            <audio controls src={message.audio} className="w-40" />
          </div>
        )}

        {/* ⏳ Timestamp */}
        <p className="text-xs text-gray-300 mt-1 text-right">{message.timestamp}</p>
      </div>
    </motion.div>
  );
};

export default MessageItem;
