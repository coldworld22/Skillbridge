import { useState, useEffect, useRef } from "react";
import formatRelativeTime from "@/utils/relativeTime";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { FaCheckDouble, FaThumbtack, FaReply, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";

const ChatWindow = ({ selectedChat, onStartVideoCall }) => {
  const [messages, setMessages] = useState(selectedChat?.messages || []);
  const [typing, setTyping] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const chatRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (typing) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);
    }
  }, [typing]);

  const sendMessage = (newMessage) => {
    if (!newMessage.text && !newMessage.image && !newMessage.audio) {
      toast.error("Message is empty!");
      return;
    }

    if (replyingTo) {
      newMessage.replyTo = replyingTo;
      setReplyingTo(null);
    }

    setMessages((prev) => [
      ...prev,
      { ...newMessage, timestamp: new Date().toISOString() },
    ]);
    setTyping(false);
    toast.success("Message sent!");
  };

  const togglePinMessage = (msg) => {
    setPinnedMessages((prev) =>
      prev.includes(msg) ? prev.filter((m) => m !== msg) : [...prev, msg]
    );
  };

  const deleteMessage = (index) => {
    setMessages((prev) => prev.filter((_, i) => i !== index));
    toast.info("Message deleted.");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-700">
        <ChatHeader selectedChat={selectedChat} onStartVideoCall={onStartVideoCall} />
      </div>

      {/* Pinned */}
      {pinnedMessages.length > 0 && (
        <div className="bg-gray-900 p-3 text-sm text-yellow-400 overflow-x-auto">
          📌 Pinned:
          {pinnedMessages.map((msg, i) => (
            <div key={i} className="text-xs mt-1 border-l-4 border-yellow-400 pl-2">
              {msg.text}
            </div>
          ))}
        </div>
      )}

     <div
  ref={chatRef}
  className="flex-1 overflow-y-auto px-3 py-2 space-y-3 bg-gray-700 rounded-md"
>
  {messages.map((msg, index) => {
    const isYou = msg.sender === "You";
    return (
      <div
        key={index}
        className={`flex items-end gap-2 ${isYou ? "justify-end" : "justify-start"}`}
      >
        {!isYou && (
          <img
            src={msg.profileImage || "/default-avatar.png"}
            className="w-7 h-7 rounded-full border border-gray-500"
            alt="avatar"
          />
        )}

        <div
          className={`px-3 py-2 rounded-lg shadow-sm max-w-sm text-sm ${
            isYou ? "bg-blue-600 text-white" : "bg-gray-600 text-white"
          }`}
        >
          {msg.replyTo && (
            <div className="text-xs italic text-yellow-300 mb-1 line-clamp-1">
              ↪ {msg.replyTo.text}
            </div>
          )}

          {!isYou && (
            <div className="text-[11px] font-semibold text-gray-300 mb-1">
              {msg.sender}
            </div>
          )}

          {msg.image && (
            <img
              src={msg.image}
              className="w-full max-w-[160px] rounded-md mb-1"
              alt="media"
            />
          )}
          {msg.audio && (
            <audio controls src={msg.audio} className="w-40 mb-1" />
          )}

          <p className="text-[13px] leading-snug break-words">{msg.text}</p>

          {/* Meta info + actions */}
          <div className="flex justify-between items-center text-[10px] text-gray-300 mt-1">
            <span className="whitespace-nowrap">{formatRelativeTime(msg.timestamp)}</span>
            <div className="flex items-center gap-2 ml-2">
              <FaCheckDouble
                className={`${
                  msg.status === "read" ? "text-blue-300" : "text-gray-400"
                }`}
              />
              <button
                onClick={() => togglePinMessage(msg)}
                title="Pin"
                className="hover:text-yellow-400"
              >
                <FaThumbtack className="text-xs" />
              </button>
              <button
                onClick={() => setReplyingTo(msg)}
                title="Reply"
                className="hover:text-blue-300"
              >
                <FaReply className="text-xs" />
              </button>
              <button
                onClick={() => deleteMessage(index)}
                title="Delete"
                className="hover:text-red-400"
              >
                <FaTrash className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  })}
  {typing && (
    <div className="text-center text-gray-300 italic text-xs mt-2">
      Typing...
    </div>
  )}
</div>


      {/* Reply Preview */}
      {replyingTo && (
        <div className="bg-gray-900 text-yellow-300 px-4 py-2 text-sm border-t border-gray-600">
          Replying to: {replyingTo.text}
          <button className="ml-2 text-red-400 hover:text-red-500" onClick={() => setReplyingTo(null)}>✖</button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-700 bg-gray-800 p-3">
        <MessageInput sendMessage={sendMessage} setTyping={setTyping} />
      </div>
    </div>
  );
};

export default ChatWindow;
