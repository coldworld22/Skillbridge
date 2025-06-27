import { useState, useEffect, useRef } from "react";
import formatRelativeTime from "@/utils/relativeTime";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { FaCheck, FaCheckDouble, FaThumbtack, FaReply, FaTrash } from "react-icons/fa";
import { API_BASE_URL } from "@/config/config";
import { toast } from "react-toastify";
import useAuthStore from "@/store/auth/authStore";
import { getConversation, sendChatMessage } from "@/services/messageService";

const ChatWindow = ({ selectedChat, onStartVideoCall, refreshUsers }) => {
  const currentUser = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const chatRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const getAvatarUrl = (url) => {
    if (!url) return "/images/default-avatar.png";
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    return `${API_BASE_URL}${url}`;
  };

  const getMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) return url;
    return `${API_BASE_URL}${url}`;
  };

  const isImage = (path) => {
    if (!path) return false;
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(path) || path.startsWith("data:image/");
  };

  useEffect(() => {
    let interval;
    const fetchConvo = () => {
      if (!selectedChat) return;
      getConversation(selectedChat.id)
        .then((msgs) => setMessages(msgs))
        .catch(() => setMessages([]));
      if (refreshUsers) refreshUsers();
    };

    fetchConvo();
    if (selectedChat) {
      interval = setInterval(fetchConvo, 10000);
    }
    return () => clearInterval(interval);
  }, [selectedChat, refreshUsers]);

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

  const sendMessage = async (newMessage) => {
    if (!newMessage.text && !newMessage.file && !newMessage.audio) {
      toast.error("Message is empty!");
      return;
    }

    try {
      const sent = await sendChatMessage(selectedChat.id, newMessage);
      setMessages((prev) => [...prev, sent]);
      setTyping(false);
      toast.success("Message sent!");
      if (refreshUsers) refreshUsers();
    } catch (_) {
      toast.error("Failed to send message");
    }
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
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-gray-800 rounded-lg shadow-md overflow-hidden w-full md:col-span-3">
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
              {isImage(msg.file_url || msg.message) ? (
                <img
                  src={getMediaUrl(msg.file_url || msg.message)}
                  alt="Pinned image"
                  className="max-w-xs rounded-md mt-1"
                />
              ) : (
                msg.message || msg.file_url?.split('/').pop()
              )}
            </div>
          ))}
        </div>
      )}

     <div
  ref={chatRef}
  className="flex-1 overflow-y-auto px-3 py-2 space-y-3 bg-gray-700 rounded-md"
>
  {messages.length === 0 && (
    <p className="text-center text-gray-300 mt-4">
      No messages yet. Type below to start the conversation.
    </p>
  )}
  {messages.map((msg, index) => {
    const isYou = msg.sender_id === currentUser?.id;
    return (
      <div
        key={index}
        className={`flex items-end gap-2 ${isYou ? "justify-end" : "justify-start"}`}
      >
        <img
          src={getAvatarUrl(
            isYou ? currentUser?.avatar_url : selectedChat.profileImage
          )}
          className="w-7 h-7 rounded-full border border-gray-500"
          alt="avatar"
        />

        <div
          className={`px-3 py-2 rounded-lg shadow-sm max-w-sm text-sm ${
            isYou ? "bg-blue-600 text-white" : "bg-gray-600 text-white"
          }`}
        >
          <div className="text-[11px] font-semibold text-gray-300 mb-1">
            {isYou ? currentUser?.full_name || "You" : selectedChat.name}
          </div>

          {msg.file_url && isImage(msg.file_url) && (
            <img
              src={getMediaUrl(msg.file_url)}
              alt="Sent image"
              className="max-w-xs rounded-md mt-1"
            />
          )}
          {msg.file_url && !isImage(msg.file_url) && (
            <a
              href={getMediaUrl(msg.file_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-200 text-sm break-all"
            >
              {msg.file_url.split('/').pop()}
            </a>
          )}
          {msg.audio_url && (
            <audio controls src={getMediaUrl(msg.audio_url)} className="mt-1 w-48" />
          )}
          {msg.message && (
            <p className="text-[13px] leading-snug break-words mt-1">{msg.message}</p>
          )}

          {/* Meta info + actions */}
          <div className="flex justify-between items-center text-[10px] text-gray-300 mt-1">
            <span className="whitespace-nowrap">{formatRelativeTime(msg.sent_at)}</span>
            <div className="flex items-center gap-2 ml-2">
              {msg.read ? (
                <FaCheckDouble className="text-blue-300" />
              ) : (
                <FaCheck className="text-gray-400" />
              )}
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
