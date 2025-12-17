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
import styles from "./ChatWindow.module.scss";

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
    <div className={styles.container}>
      <div className={styles.header}>
        <ChatHeader selectedChat={selectedChat} onStartVideoCall={handleStartVideoCall} />
      </div>

      {pinnedMessages.length > 0 && (
        <div className={styles.pinned}>
          <span className={styles.pinnedLabel}>📌 Pinned</span>
          {pinnedMessages.map((msg, i) => (
            <div key={i} className={styles.pinnedItem}>
              {isImage(msg.file_url || msg.message) ? (
                <ChatImage
                  src={getMediaUrl(msg.file_url || msg.message)}
                  alt="Pinned message"
                  className={styles.pinnedImage}
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

      <div ref={chatRef} className={styles.messages}>
        {messages.length === 0 && (
          <p className={styles.empty}>
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
              className={`${styles.messageRow} ${isYou ? styles.alignEnd : ""}`}
            >
              <ChatImage
                src={getAvatarUrl(isYou ? currentUser?.avatar_url : otherAvatar)}
                className={styles.avatar}
                alt={`${senderName} avatar`}
                width={28}
                height={28}
              />

              <div
                className={`${styles.bubble} ${isYou ? styles.bubbleSender : ""}`}
              >
                {msg.pinned && (
                  <FaThumbtack className={styles.pinnedIcon} />
                )}
                <div
                  className={`${styles.senderName} ${
                    isYou ? styles.senderNameSender : styles.senderNameReceiver
                  }`}
                >
                  {senderName}
                </div>

                {msg.type === "video-call" ? (
                  <div className={styles.callWrapper}>
                    <p className={styles.messageText}>
                      {isYou ? "Video call started" : "Incoming video call"}
                    </p>
                    <div className={styles.callButtons}>
                      {isYou ? (
                        <button
                          onClick={() => router.push(`/video-call?roomId=${msg.message}`)}
                          className={`${styles.callButton} ${styles.join}`}
                          type="button"
                        >
                          Join
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleAcceptCall(msg)}
                            className={`${styles.callButton} ${styles.accept}`}
                            type="button"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineCall(msg)}
                            className={`${styles.callButton} ${styles.decline}`}
                            type="button"
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
                      <div className={styles.replyText}>
                        <span className={styles.italic}>{msg.reply_message}</span>
                      </div>
                    )}
                    {msg.reply_file_url && isImage(msg.reply_file_url) && (
                      <div className={styles.replyMedia}>
                        <ChatImage
                          src={getMediaUrl(msg.reply_file_url)}
                          alt="Reply attachment"
                          className={styles.replyImage}
                          width={200}
                          height={200}
                        />
                      </div>
                    )}
                    {msg.reply_file_url && !isImage(msg.reply_file_url) && (
                      <div className={styles.replyText}>
                        <a
                          href={getMediaUrl(msg.reply_file_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.replyLink}
                        >
                          {msg.reply_file_url.split("/").pop()}
                        </a>
                      </div>
                    )}
                    {msg.reply_audio_url && (
                      <div className={styles.replyAudio}>
                        <audio controls src={getMediaUrl(msg.reply_audio_url)} className={styles.attachmentAudio}>
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}

                    {msg.file_url && isImage(msg.file_url) && (
                      <ChatImage
                        src={getMediaUrl(msg.file_url)}
                        alt="Attachment"
                        className={styles.attachmentImage}
                        width={200}
                        height={200}
                      />
                    )}
                    {msg.file_url && !isImage(msg.file_url) && (
                      <a
                        href={getMediaUrl(msg.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.attachmentLink}
                      >
                        {msg.file_url.split("/").pop()}
                      </a>
                    )}
                    {msg.audio_url && (
                      <audio controls src={getMediaUrl(msg.audio_url)} className={styles.attachmentAudio}>
                        Your browser does not support the audio element.
                      </audio>
                    )}
                    {msg.message && (
                      <p className={styles.messageText}>{msg.message}</p>
                    )}
                  </>
                )}

                <div className={styles.meta}>
                  <span className={styles.nowrap}>
                    {formatRelativeTime(msg.sent_at)}
                  </span>
                  <div className={styles.metaActions}>
                    {msg.read ? (
                      <FaCheckDouble className={styles.metaIcon} />
                    ) : (
                      <FaCheck className={styles.metaIcon} />
                    )}
                    <button
                      onClick={() => togglePinMessageHandler(msg)}
                      title="Pin"
                      className={styles.metaButton}
                      type="button"
                    >
                      <FaThumbtack className={styles.iconSmall} />
                    </button>
                    <button
                      onClick={() => setReplyingTo(msg)}
                      title="Reply"
                      className={styles.metaButton}
                      type="button"
                    >
                      <FaReply className={styles.iconSmall} />
                    </button>
                    <button
                      onClick={() => deleteMessageHandler(msg.id)}
                      title="Delete"
                      className={`${styles.metaButton} ${styles.delete}`}
                      type="button"
                    >
                      <FaTrash className={styles.iconSmall} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {typing && (
        <div className={styles.typing}>
          {fallbackName} is typing...
        </div>
      )}

      {replyingTo && (
        <div className={styles.replying}>
          Replying to:{" "}
          {replyingTo.message ||
            replyingTo.text ||
            replyingTo.file_url?.split("/").pop() ||
            (replyingTo.audio_url ? "Voice message" : "Message")}
          <button
            className={styles.closeReply}
            onClick={() => setReplyingTo(null)}
            type="button"
          >
            ✖
          </button>
        </div>
      )}

      <div className={styles.inputBar}>
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
