import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { FaCheck, FaCheckDouble, FaReply, FaThumbtack, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import ChatImage from "../shared/ChatImage";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import formatRelativeTime from "@/utils/relativeTime";
import { API_BASE_URL } from "@/config/config";
import useAuthStore from "@/store/auth/authStore";
import {
  deleteChatMessage as apiDeleteChatMessage,
  getConversation,
  sendChatMessage,
  startVideoCall,
  togglePinMessage as apiTogglePinMessage,
} from "@/services/messageService";
import socket from "@/services/socketService";

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

const ChatWindow = ({ selectedChat, refreshUsers }) => {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const chatRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    let interval;

    const fetchConversation = () => {
      if (!selectedChat) return;
      getConversation(selectedChat.id)
        .then((msgs) => setMessages(msgs))
        .catch(() => setMessages([]));
      refreshUsers?.();
    };

    fetchConversation();
    if (selectedChat) {
      interval = setInterval(fetchConversation, 10000);
    }

    return () => clearInterval(interval);
  }, [selectedChat, refreshUsers]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!typing) return;

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);

    return () => clearTimeout(typingTimeoutRef.current);
  }, [typing]);

  const handleStartVideoCall = async (chatId) => {
    try {
      const displayName =
        selectedChat?.groupName ||
        selectedChat?.name ||
        selectedChat?.full_name ||
        selectedChat?.email ||
        "Conversation";
      const res = await startVideoCall(chatId, { name: displayName });
      toast.info("Calling...");
      return res;
    } catch (_) {
      toast.error("Failed to start video call");
      return null;
    }
  };

  const handleAcceptCall = (msg) => {
    socket.emit("call-accepted", {
      chatId: msg.sender_id,
      roomId: msg.message,
    });
    router.push(`/video-call?roomId=${msg.message}`);
  };

  const handleDeclineCall = (msg) => {
    socket.emit("call-declined", { chatId: msg.sender_id });
  };

  const sendMessage = async (newMessage) => {
    if (!newMessage.text && !newMessage.file && !newMessage.audio) {
      toast.error("Message is empty!");
      return;
    }

    try {
      const replySnapshot = replyingTo;
      const sent = await sendChatMessage(selectedChat.id, {
        ...newMessage,
        replyId: replySnapshot?.id,
      });

      const enriched = {
        ...sent,
        reply_message:
          sent.reply_message ??
          replySnapshot?.message ??
          replySnapshot?.text ??
          null,
        reply_file_url:
          sent.reply_file_url ??
          replySnapshot?.file_url ??
          replySnapshot?.file ??
          null,
        reply_audio_url:
          sent.reply_audio_url ??
          replySnapshot?.audio_url ??
          replySnapshot?.audio ??
          null,
      };

      setMessages((prev) => [...prev, enriched]);
      setReplyingTo(null);
      setTyping(false);
      toast.success("Message sent!");
      refreshUsers?.();
    } catch (_) {
      toast.error("Failed to send message");
    }
  };

  const togglePinMessageHandler = async (msg) => {
    try {
      const updated = await apiTogglePinMessage(msg.id);
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      toast.info(updated.pinned ? "Message pinned" : "Message unpinned");
    } catch (_) {
      toast.error("Failed to pin message");
    }
  };

  const deleteMessageHandler = async (msgId) => {
    try {
      await apiDeleteChatMessage(msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      toast.info("Message deleted");
    } catch (_) {
      toast.error("Failed to delete message");
    }
  };

  const pinnedMessages = messages.filter((m) => m.pinned);
  const fallbackName =
    selectedChat?.groupName ||
    selectedChat?.name ||
    selectedChat?.full_name ||
    selectedChat?.email ||
    "Conversation";

  return (
    <div className="flex h-[calc(100vh-7rem)] w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 bg-white">
        <ChatHeader selectedChat={selectedChat} onStartVideoCall={handleStartVideoCall} />
      </div>

      {pinnedMessages.length > 0 && (
        <div className="border-b border-gray-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <span className="font-medium">📌 Pinned</span>
          {pinnedMessages.map((msg, i) => (
            <div key={i} className="mt-2 border-l-4 border-yellow-300 pl-3 text-xs">
              {isImage(msg.file_url || msg.message) ? (
                <ChatImage
                  src={getMediaUrl(msg.file_url || msg.message)}
                  alt="Pinned message"
                  className="mt-1 max-w-xs rounded-md"
                  width={200}
                  height={200}
                />
              ) : (
                msg.message || msg.file_url?.split("/").pop()
              )}
            </div>
          ))}
        </div>
      )}

      <div ref={chatRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-3">
        {messages.length === 0 && (
          <p className="mt-4 text-center text-sm text-gray-500">
            No messages yet. Type below to start the conversation.
          </p>
        )}

        {messages.map((msg, index) => {
          const isYou = msg.sender_id === currentUser?.id;
          const otherAvatar =
            selectedChat?.profileImage ||
            selectedChat?.profile_image ||
            selectedChat?.avatar_url;
          const senderName = isYou
            ? currentUser?.full_name || "You"
            : fallbackName;

          return (
            <div
              key={index}
              className={`flex items-end gap-2 ${isYou ? "justify-end" : "justify-start"}`}
            >
              <ChatImage
                src={getAvatarUrl(isYou ? currentUser?.avatar_url : otherAvatar)}
                className="h-7 w-7 rounded-full border border-white shadow"
                alt={`${senderName} avatar`}
                width={28}
                height={28}
              />

              <div
                className={`relative max-w-sm rounded-lg border px-3 py-2 text-sm shadow-sm ${
                  isYou
                    ? "border-yellow-300 bg-yellow-400 text-gray-900"
                    : "border-gray-200 bg-white text-gray-900"
                }`}
              >
                {msg.pinned && (
                  <FaThumbtack className="absolute -left-2 -top-2 text-yellow-400 text-xs" />
                )}
                <div
                  className={`mb-1 text-[11px] font-semibold ${
                    isYou ? "text-yellow-900" : "text-gray-500"
                  }`}
                >
                  {senderName}
                </div>

                {msg.type === "video-call" ? (
                  <div className="mt-1 flex flex-col items-center">
                    <p className="text-[13px] leading-snug">
                      {isYou ? "Video call started" : "Incoming video call"}
                    </p>
                    <div className="mt-1 flex gap-2">
                      {isYou ? (
                        <button
                          onClick={() => router.push(`/video-call?roomId=${msg.message}`)}
                          className="rounded bg-green-600 px-2 py-1 text-xs text-white transition hover:bg-green-500"
                        >
                          Join
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleAcceptCall(msg)}
                            className="rounded bg-green-600 px-2 py-1 text-xs text-white transition hover:bg-green-500"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineCall(msg)}
                            className="rounded bg-red-500 px-2 py-1 text-xs text-white transition hover:bg-red-400"
                          >
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {msg.reply_message && (
                      <div className="mb-1 border-l-2 border-yellow-300 pl-2 text-xs text-gray-500">
                        <span className="italic">{msg.reply_message}</span>
                      </div>
                    )}
                    {msg.reply_file_url && isImage(msg.reply_file_url) && (
                      <div className="mb-1 border-l-2 border-yellow-300 pl-2">
                        <ChatImage
                          src={getMediaUrl(msg.reply_file_url)}
                          alt="Reply attachment"
                          className="max-w-xs rounded-md"
                          width={200}
                          height={200}
                        />
                      </div>
                    )}
                    {msg.reply_file_url && !isImage(msg.reply_file_url) && (
                      <div className="mb-1 border-l-2 border-yellow-300 pl-2 text-xs">
                        <a
                          href={getMediaUrl(msg.reply_file_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-700 underline"
                        >
                          {msg.reply_file_url.split("/").pop()}
                        </a>
                      </div>
                    )}
                    {msg.reply_audio_url && (
                      <div className="mb-1 border-l-2 border-yellow-300 pl-2">
                        <audio controls src={getMediaUrl(msg.reply_audio_url)} className="w-48">
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}

                    {msg.file_url && isImage(msg.file_url) && (
                      <ChatImage
                        src={getMediaUrl(msg.file_url)}
                        alt="Attachment"
                        className="mt-1 max-w-xs rounded-md"
                        width={200}
                        height={200}
                      />
                    )}
                    {msg.file_url && !isImage(msg.file_url) && (
                      <a
                        href={getMediaUrl(msg.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-sm text-yellow-700 underline"
                      >
                        {msg.file_url.split("/").pop()}
                      </a>
                    )}
                    {msg.audio_url && (
                      <audio controls src={getMediaUrl(msg.audio_url)} className="mt-1 w-48">
                        Your browser does not support the audio element.
                      </audio>
                    )}
                    {msg.message && (
                      <p className="mt-1 break-words text-[13px] leading-snug">{msg.message}</p>
                    )}
                  </>
                )}

                <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
                  <span className="whitespace-nowrap">
                    {formatRelativeTime(msg.sent_at)}
                  </span>
                  <div className="ml-2 flex items-center gap-2">
                    {msg.read ? (
                      <FaCheckDouble className="text-yellow-500" />
                    ) : (
                      <FaCheck className="text-gray-400" />
                    )}
                    <button
                      onClick={() => togglePinMessageHandler(msg)}
                      title="Pin"
                      className="transition hover:text-yellow-600"
                    >
                      <FaThumbtack className="text-xs" />
                    </button>
                    <button
                      onClick={() => setReplyingTo(msg)}
                      title="Reply"
                      className="transition hover:text-yellow-600"
                    >
                      <FaReply className="text-xs" />
                    </button>
                    <button
                      onClick={() => deleteMessageHandler(msg.id)}
                      title="Delete"
                      className="transition hover:text-red-500"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {typing && (
        <div className="border-t border-gray-200 bg-white px-4 py-2 text-sm text-gray-500">
          {fallbackName} is typing...
        </div>
      )}

      {replyingTo && (
        <div className="border-t border-gray-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-700">
          Replying to:{" "}
          {replyingTo.message ||
            replyingTo.text ||
            replyingTo.file_url?.split("/").pop() ||
            (replyingTo.audio_url ? "Voice message" : "Message")}
          <button
            className="ml-3 text-sm font-semibold text-yellow-700 hover:text-yellow-600"
            onClick={() => setReplyingTo(null)}
          >
            ✖
          </button>
        </div>
      )}

      <div className="border-t border-gray-200 bg-white p-3">
        <MessageInput
          sendMessage={sendMessage}
          replyTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onTyping={setTyping}
        />
      </div>
    </div>
  );
};

export default ChatWindow;
