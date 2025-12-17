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
import styles from "./MessageItem.module.scss";

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
      className={`${styles.messageRow} ${isSender ? styles.sender : ""}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Avatar */}
      <ChatImage
        src={message.avatar || '/images/default-avatar.png'}
        alt="avatar"
        className={styles.avatar}
        width={24}
        height={24}
      />

      {/* Message Bubble */}
      <div
        className={`${styles.bubble} ${
          isSender ? styles.senderBubble : styles.receiverBubble
        }`}
      >
        {/* Sender Name */}
        <div
          className={`${styles.senderName} ${
            isSender ? styles.senderNameSender : styles.senderNameReceiver
          }`}
        >
          {isSender ? "You" : message.sender}
        </div>
        {/* 📌 Reply Preview */}
        {message.replyTo && (
          <div className={styles.replyPreview}>
            Replying to: “{message.replyTo}”
          </div>
        )}

        {/* 📝 Message Text */}
        {message.text && <p className={styles.text}>{message.text}</p>}

        {/* 📷 Image */}
        {message.file && isImage(message.file) && (
          <ChatImage
            src={getMediaUrl(message.file)}
            alt="Sent image"
            className={styles.image}
            width={300}
            height={200}
          />
        )}
        {message.file && !isImage(message.file) && (
          <a
            href={getMediaUrl(message.file)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.fileLink}
          >
            {message.file.split('/').pop()}
          </a>
        )}

        {/* 🎤 Audio */}
        {message.audio && (
          <div className={styles.audioBox}>
            <FaPlay className={styles.audioIcon} />
            <audio controls src={message.audio} className={styles.audioPlayer} />
          </div>
        )}

        {/* 🔧 Hover Actions */}
        <div className={styles.actions}>
          <button onClick={onReply} title="Reply" className={styles.action}>
            <FaReply />
          </button>
          <button onClick={onPin} title="Pin" className={styles.action}>
            <FaThumbtack />
          </button>
          <button onClick={onDelete} title="Delete" className={`${styles.action} ${styles.actionDanger}`}>
            <FaTrash />
          </button>
        </div>

        {/* ⏰ Timestamp + Seen */}
        <div className={styles.meta}>
          <span>{formatRelativeTime(message.timestamp)}</span>
          {isSender && <FaCheckDouble className={styles.seen} title="Sent" />}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageItem;
